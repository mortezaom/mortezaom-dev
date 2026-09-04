// Public contact form: validation + spam filters + DB save + Resend email.
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server';
import { desc } from 'drizzle-orm';
import { Resend } from 'resend';
import { verifySession, SESSION_COOKIE } from '../lib/auth';
import { getDb, schema } from '../lib/db/client';
import { getCookie } from '@tanstack/react-start/server';

const json =
  <T>() =>
  (d: unknown) =>
    d as T;

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  /** Honeypot: must stay empty. Bots fill it. */
  website?: string;
  /** Time-trap: ms epoch when form was rendered client-side. */
  renderedAt?: number;
}

export interface ContactMessageRow {
  id: number;
  name: string;
  email: string;
  message: string;
  ip: string | null;
  userAgent: string | null;
  origin: string | null;
  isSpam: number;
  spamReason: string | null;
  createdAt: number;
}

/** Origin/referer must match Host (same pattern as admin CSRF guard). */
function assertAllowedOrigin(): string | null {
  const origin = getRequestHeader('origin');
  const referer = getRequestHeader('referer');
  const host = getRequestHeader('host');
  const candidate = origin ?? referer;
  if (!candidate || !host) return candidate;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('FORBIDDEN');
  }
  if (url.host !== host) throw new Error('FORBIDDEN');
  return candidate;
}

// Per-process IP buckets; use Redis/DB past one instance.
const MAX_ENTRIES = 2000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > MAX_ENTRIES) {
    const oldest = hits.keys().next();
    if (!oldest.done) hits.delete(oldest.value);
  }
  return list.length > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /https?:\/\/|www\./i;

function spamCheck(input: ContactInput, now: number): string | null {
  // Honeypot filled -> bot.
  if (input.website && input.website.trim() !== '') return 'honeypot';
  // Submitted faster than 2s after render -> bot (missing = suspicious but allowed).
  if (
    typeof input.renderedAt === 'number' &&
    Number.isFinite(input.renderedAt) &&
    now - input.renderedAt < 2000
  )
    return 'fast-submit';
  const links = (input.message.match(/https?:\/\//gi) ?? []).length;
  if (links >= 3 || (URL_RE.test(input.message) && input.message.length < 60))
    return 'link-spam';
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendNotificationEmail(row: {
  name: string;
  email: string;
  message: string;
  ip: string | null;
  origin: string | null;
  createdAt: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return;
  const from =
    process.env.CONTACT_FROM_EMAIL ?? 'Contact Form <onboarding@resend.dev>';
  const resend = new Resend(apiKey);
  const date = new Date(row.createdAt).toISOString();
  // Full data: short enough to fit an email.
  await resend.emails.send({
    from,
    to,
    replyTo: row.email,
    subject: `New contact from ${row.name}`,
    text: `Name: ${row.name}\nEmail: ${row.email}\nIP: ${row.ip ?? '-'}\nOrigin: ${row.origin ?? '-'}\nDate: ${date}\n\n${row.message}`,
    html: `<h2>New contact submission</h2><ul><li><b>Name:</b> ${escapeHtml(row.name)}</li><li><b>Email:</b> ${escapeHtml(row.email)}</li><li><b>IP:</b> ${escapeHtml(row.ip ?? '-')}</li><li><b>Origin:</b> ${escapeHtml(row.origin ?? '-')}</li><li><b>Date:</b> ${escapeHtml(date)}</li></ul><p>${escapeHtml(row.message).replace(/\n/g, '<br/>')}</p>`,
  });
}

export const submitContactFn = createServerFn({ method: 'POST' })
  .validator(json<ContactInput>())
  .handler(async ({ data }) => {
    const now = Date.now();
    const candidate = assertAllowedOrigin();
    const ip = getRequestIP() ?? 'unknown';
    if (rateLimited(ip, now))
      throw new Error('Too many messages. Try again later.');

    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (name.length < 2 || name.length > 100)
      throw new Error('Name must be 2–100 characters.');
    if (email.length > 320 || !EMAIL_RE.test(email))
      throw new Error('Enter a valid email address.');
    if (message.length < 10 || message.length > 5000)
      throw new Error('Message must be 10–5000 characters.');

    const spamReason = spamCheck(data, now);
    const userAgent = getRequestHeader('user-agent') ?? null;
    const db = getDb();
    await db.insert(schema.contactMessages).values({
      name,
      email,
      message,
      ip,
      userAgent,
      origin: candidate,
      isSpam: spamReason ? 1 : 0,
      spamReason,
      createdAt: now,
    });

    // Silent success for bots; real mail only for legit mail.
    if (!spamReason) {
      try {
        await sendNotificationEmail({
          name,
          email,
          message,
          ip,
          origin: candidate,
          createdAt: now,
        });
      } catch (err) {
        console.error(
          `Contact email failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return { ok: true as const };
  });

function requireAdmin(): void {
  if (!verifySession(getCookie(SESSION_COOKIE)))
    throw new Error('UNAUTHORIZED');
}

export const listContactMessagesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ messages: ContactMessageRow[] }> => {
    requireAdmin();
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.contactMessages)
      .orderBy(desc(schema.contactMessages.createdAt))
      .limit(500);
    return { messages: rows };
  },
);

export const deleteContactMessageFn = createServerFn({ method: 'POST' })
  .validator(json<{ id: number }>())
  .handler(async ({ data }) => {
    requireAdmin();
    const { eq } = await import('drizzle-orm');
    if (typeof data.id !== 'number' || !Number.isInteger(data.id))
      throw new Error('Invalid id.');
    const db = getDb();
    await db
      .delete(schema.contactMessages)
      .where(eq(schema.contactMessages.id, data.id));
    return { ok: true as const };
  });
