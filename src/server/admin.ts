// Admin server fns: env-single-admin auth + per-page slice saves + JSON import/export.
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createServerFn } from '@tanstack/react-start';
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestIP,
  setCookie,
} from '@tanstack/react-start/server';
import {
  revokeSession,
  SESSION_COOKIE,
  signSession,
  verifySession,
} from '../lib/auth';
import {
  assertEmail,
  assertSafeHref,
  assertSiteUrl,
  bumpVersion,
  exportSeedObject,
  importValidated,
  stringifySeed,
  validateSeed,
  verifyPassword,
  writeSeoFiles,
} from '../lib/cms-core';
import { invalidateContentCache } from '../lib/content';
import { getDb, getDbFile, schema } from '../lib/db/client';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 12 * 60 * 60,
};

function requireAdmin(): string {
  const user = verifySession(getCookie(SESSION_COOKIE));
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

/**
 * CSRF guard for state-changing fns: cookies alone are not enough.
 * SameSite=lax blocks most cross-site POSTs; this rejects the rest.
 * Skips when neither header is present (non-browser callers).
 */
function assertSameOrigin(): void {
  const origin = getRequestHeader('origin');
  const referer = getRequestHeader('referer');
  const host = getRequestHeader('host');
  const candidate = origin ?? referer;
  if (!candidate || !host) return;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('FORBIDDEN');
  }
  if (url.host !== host) throw new Error('FORBIDDEN');
}

/** Auth + CSRF for POST mutations. */
function requireAdminPost(): string {
  assertSameOrigin();
  return requireAdmin();
}

/** Pass-through validator: inputs are plain JSON, validated inside handlers. */
const json =
  <T>() =>
  (d: unknown) =>
    d as T;

interface LoginInput {
  username: string;
  password: string;
}

/* ---------- session ---------- */

// IP+username keyed, bounded, self-expiring. Per-process: correct for a
// single Node instance behind trusted networking; use Redis/DB when
// scaling horizontally.
const MAX_ATTEMPTS = 1000;
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map<string, { fails: number; until: number }>();

function rateKey(username: string): string {
  const ip = getRequestIP() ?? 'unknown';
  const user = username.length > 128 ? username.slice(0, 128) : username;
  return `${ip}:${user}`;
}

function rateLimited(key: string, now: number): boolean {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (rec.until && now >= rec.until) {
    // Lockout expired — decay instead of locking forever.
    attempts.delete(key);
    return false;
  }
  return now < rec.until;
}

function rateFail(key: string, now: number): void {
  const rec = attempts.get(key) ?? { fails: 0, until: 0 };
  const fails = rec.fails + 1;
  attempts.set(key, {
    fails,
    until: fails >= LOCK_AFTER ? now + LOCK_MS : 0,
  });
  if (attempts.size > MAX_ATTEMPTS) {
    // Evict an expired entry first, else the oldest.
    let evicted = false;
    for (const [k, v] of attempts) {
      if (v.until && now >= v.until) {
        attempts.delete(k);
        evicted = true;
        break;
      }
    }
    if (!evicted) {
      const oldest = attempts.keys().next();
      if (!oldest.done) attempts.delete(oldest.value);
    }
  }
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator(json<LoginInput>())
  .handler(async ({ data }) => {
    assertSameOrigin();
    const username = typeof data.username === 'string' ? data.username : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const now = Date.now();
    const key = rateKey(username);
    if (rateLimited(key, now))
      throw new Error('Too many attempts. Try again later.');

    const okUser = username === process.env.ADMIN_USERNAME;
    const okPass = await verifyPassword(
      password,
      process.env.ADMIN_PASSWORD_HASH ?? '',
    ).catch(() => false);
    if (!okUser || !okPass || !username || !password) {
      rateFail(key, now);
      throw new Error('Invalid credentials.');
    }
    attempts.delete(key);
    setCookie(SESSION_COOKIE, signSession(username), COOKIE_OPTS);
    return { ok: true as const };
  });

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  assertSameOrigin();
  revokeSession(getCookie(SESSION_COOKIE));
  deleteCookie(SESSION_COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
  return { ok: true as const };
});

export const sessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  return { user: verifySession(getCookie(SESSION_COOKIE)) };
});

/* ---------- slice validation ---------- */

const MAX_TEXT = 5000;
const req = (v: unknown, what: string, max = MAX_TEXT): string => {
  if (typeof v !== 'string' || !v)
    throw new Error(`Invalid content: ${what} is required`);
  if (v.length > max)
    throw new Error(`Invalid content: ${what} exceeds ${max} chars`);
  return v;
};
const opt = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const optHref = (v: unknown, what: string): string | null => {
  if (v == null || v === '') return null;
  if (typeof v !== 'string') throw new Error(`Invalid content: ${what}`);
  return assertSafeHref(v, what);
};
const strList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === 'string' && x.length <= 500)
        .slice(0, 100)
    : [];
interface LinkIn {
  label: unknown;
  href: unknown;
}
const links = (v: unknown, what: string) => {
  if (!Array.isArray(v))
    throw new Error(`Invalid content: ${what} must be an array`);
  if (v.length > 100)
    throw new Error(`Invalid content: ${what} exceeds 100 items`);
  return (v as LinkIn[]).map((l, i) => ({
    label: req(l.label, `${what}[].label`, 500),
    href: assertSafeHref(req(l.href, `${what}[].href`, 2000), `${what}[].href`),
    sortOrder: i,
  }));
};
interface SectionIn {
  eyebrow: unknown;
  title: unknown;
  copy: unknown;
}
const section = (v: unknown, what: string) => {
  const s = v as SectionIn;
  return {
    eyebrow: opt(s?.eyebrow) ?? null,
    title: req(s?.title, `${what}.title`),
    copy: opt(s?.copy) ?? null,
  };
};

/** Log SEO write failures instead of swallowing them silently. */
async function refreshSeo(siteUrl: string): Promise<void> {
  try {
    await writeSeoFiles(siteUrl);
  } catch (err) {
    console.error(
      `SEO files not written: ${err instanceof Error ? err.message : err}`,
    );
  }
}

/* ---------- page saves (replace-all per table, one transaction) ---------- */

export const saveSiteFn = createServerFn({ method: 'POST' })
  .validator(json<Record<string, unknown>>())
  .handler(async ({ data }) => {
    requireAdminPost();
    const s = data.site as Record<string, unknown>;
    const siteRow = {
      id: 1,
      siteUrl: assertSiteUrl(s.siteUrl),
      title: req(s.title, 'site.title'),
      description: req(s.description, 'site.description'),
      socialDescription: req(s.socialDescription, 'site.socialDescription'),
      ogImage: req(s.ogImage, 'site.ogImage', 2000),
      author: req(s.author, 'site.author'),
      twitterCreator: req(s.twitterCreator, 'site.twitterCreator'),
      themeColor: req(s.themeColor, 'site.themeColor', 100),
    };
    const nav = links(data.navLinks, 'navLinks');
    const quick = links(data.quickLinks, 'quickLinks');
    const footer = links(data.footerLinks, 'footerLinks');
    if (!Array.isArray(data.socials))
      throw new Error('Invalid content: socials must be an array');
    if (data.socials.length > 100)
      throw new Error('Invalid content: socials exceeds 100 items');
    const social = (data.socials as (LinkIn & { icon: unknown })[]).map(
      (l, i) => ({
        label: req(l.label, 'socials[].label', 500),
        href: assertSafeHref(
          req(l.href, 'socials[].href', 2000),
          'socials[].href',
        ),
        icon: req(l.icon, 'socials[].icon', 100),
        sortOrder: i,
      }),
    );
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.delete(schema.site);
      await tx.insert(schema.site).values(siteRow);
      await tx.delete(schema.navLinks);
      if (nav.length) await tx.insert(schema.navLinks).values(nav);
      await tx.delete(schema.quickLinks);
      if (quick.length) await tx.insert(schema.quickLinks).values(quick);
      await tx.delete(schema.socials);
      if (social.length) await tx.insert(schema.socials).values(social);
      await tx.delete(schema.footerLinks);
      if (footer.length) await tx.insert(schema.footerLinks).values(footer);
      await bumpVersion(tx);
    });
    invalidateContentCache();
    await refreshSeo(siteRow.siteUrl);
    return { ok: true as const };
  });

export const saveProfileFn = createServerFn({ method: 'POST' })
  .validator(json<Record<string, unknown>>())
  .handler(async ({ data }) => {
    requireAdminPost();
    const p = data.profile as Record<string, unknown>;
    const profileRow = {
      id: 1,
      email: assertEmail(p.email, 'profile.email'),
      cvPath: assertSafeHref(
        req(p.cvPath, 'profile.cvPath', 2000),
        'profile.cvPath',
      ),
      heroName: JSON.stringify(strList(p.heroName)),
      heroRole: req(p.heroRole, 'profile.heroRole'),
      heroTagline: req(p.heroTagline, 'profile.heroTagline'),
      heroCardTitle: req(p.heroCardTitle, 'profile.heroCardTitle'),
      heroCardCopy: req(p.heroCardCopy, 'profile.heroCardCopy'),
      aboutParagraphs: JSON.stringify(strList(p.aboutParagraphs)),
      portraitAlt: req(p.portraitAlt, 'profile.portraitAlt'),
      contactHeading: req(p.contactHeading, 'profile.contactHeading'),
      contactCopy: req(p.contactCopy, 'profile.contactCopy'),
    };
    const about = section(data.about, 'about');
    if (!Array.isArray(data.stats))
      throw new Error('Invalid content: stats must be an array');
    if (data.stats.length > 100)
      throw new Error('Invalid content: stats exceeds 100 items');
    const stats = (data.stats as { value: unknown; label: unknown }[]).map(
      (x, i) => ({
        value: req(x.value, 'stats[].value'),
        label: req(x.label, 'stats[].label'),
        sortOrder: i,
      }),
    );
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.delete(schema.profile);
      await tx.insert(schema.profile).values(profileRow);
      await tx.delete(schema.stats);
      if (stats.length) await tx.insert(schema.stats).values(stats);
      await tx
        .insert(schema.sections)
        .values({ key: 'about', ...about })
        .onConflictDoUpdate({ target: schema.sections.key, set: about });
      await bumpVersion(tx);
    });
    invalidateContentCache();
    return { ok: true as const };
  });

interface ProjectIn {
  kind: unknown;
  category: unknown;
  name: unknown;
  href: unknown;
  description: unknown;
  ownership: unknown;
  role: unknown;
  status: unknown;
  linkLabel: unknown;
  technologies: unknown;
}
const projectRow = (p: ProjectIn) => {
  const kind = req(p.kind, 'projects[].kind');
  if (!['spotlight', 'engineering', 'archive'].includes(kind)) {
    throw new Error(
      'Invalid content: projects[].kind must be spotlight|engineering|archive',
    );
  }
  return {
    kind,
    category: opt(p.category) ?? null,
    name: req(p.name, 'projects[].name'),
    href: optHref(p.href, 'projects[].href'),
    description: opt(p.description) ?? null,
    ownership: opt(p.ownership) ?? null,
    role: opt(p.role) ?? null,
    status: opt(p.status) ?? null,
    linkLabel: opt(p.linkLabel) ?? null,
    technologies: JSON.stringify(strList(p.technologies)),
    sortOrder: 0,
  };
};

export const saveWorkFn = createServerFn({ method: 'POST' })
  .validator(json<Record<string, unknown>>())
  .handler(async ({ data }) => {
    requireAdminPost();
    const secs = data.sections as Record<string, unknown>;
    const sections = {
      workSpotlight: section(secs.workSpotlight, 'workSpotlight'),
      workEngineering: section(secs.workEngineering, 'workEngineering'),
      workArchive: section(secs.workArchive, 'workArchive'),
    };
    if (!Array.isArray(data.projects))
      throw new Error('Invalid content: projects must be an array');
    if (data.projects.length > 500)
      throw new Error('Invalid content: projects exceeds 500 items');
    const projects = (data.projects as ProjectIn[]).map((p, i) => ({
      ...projectRow(p),
      sortOrder: i,
    }));
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.delete(schema.projects);
      if (projects.length) await tx.insert(schema.projects).values(projects);
      for (const [key, s] of Object.entries(sections)) {
        await tx
          .insert(schema.sections)
          .values({ key, ...s })
          .onConflictDoUpdate({ target: schema.sections.key, set: s });
      }
      await bumpVersion(tx);
    });
    invalidateContentCache();
    return { ok: true as const };
  });

export const saveCareerFn = createServerFn({ method: 'POST' })
  .validator(json<Record<string, unknown>>())
  .handler(async ({ data }) => {
    requireAdminPost();
    const secs = data.sections as Record<string, unknown>;
    const sections = {
      experience: section(secs.experience, 'experience'),
      skills: section(secs.skills, 'skills'),
    };
    if (!Array.isArray(data.experience))
      throw new Error('Invalid content: experience must be an array');
    if (data.experience.length > 200)
      throw new Error('Invalid content: experience exceeds 200 items');
    if (!Array.isArray(data.skillGroups))
      throw new Error('Invalid content: skillGroups must be an array');
    if (data.skillGroups.length > 100)
      throw new Error('Invalid content: skillGroups exceeds 100 items');
    const exp = (data.experience as Record<string, unknown>[]).map((e, i) => ({
      role: req(e.role, 'experience[].role'),
      company: req(e.company, 'experience[].company'),
      period: req(e.period, 'experience[].period'),
      startDate: req(e.startDate, 'experience[].startDate'),
      description: req(e.description, 'experience[].description'),
      stack: JSON.stringify(strList(e.stack)),
      sortOrder: i,
    }));
    const skills = (data.skillGroups as Record<string, unknown>[]).map(
      (g, i) => ({
        name: req(g.name, 'skillGroups[].name'),
        technologies: JSON.stringify(strList(g.technologies)),
        sortOrder: i,
      }),
    );
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.delete(schema.experience);
      if (exp.length) await tx.insert(schema.experience).values(exp);
      await tx.delete(schema.skillGroups);
      if (skills.length) await tx.insert(schema.skillGroups).values(skills);
      for (const [key, s] of Object.entries(sections)) {
        await tx
          .insert(schema.sections)
          .values({ key, ...s })
          .onConflictDoUpdate({ target: schema.sections.key, set: s });
      }
      await bumpVersion(tx);
    });
    invalidateContentCache();
    return { ok: true as const };
  });

/* ---------- JSON import / export ---------- */

export const importJsonFn = createServerFn({ method: 'POST' })
  .validator(json<{ json: string; dryRun?: boolean }>())
  .handler(async ({ data }) => {
    requireAdminPost();
    if (typeof data.json !== 'string' || data.json.length > 5_000_000)
      throw new Error('Invalid JSON.');
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.json) as unknown;
    } catch {
      throw new Error('Invalid JSON.');
    }
    const validated = validateSeed(parsed);
    if (data.dryRun) return { ok: true as const, counts: validated.counts };
    // Backup current content before the destructive replace-all.
    const stamp = Date.now();
    let backup = '';
    try {
      const current = stringifySeed(await exportSeedObject());
      const name = `portfolio-backup-${stamp}.json`;
      backup = join(tmpdir(), name);
      await writeFile(backup, `${current}\n`);
      try {
        await mkdir(dirname(getDbFile()), { recursive: true });
        await writeFile(join(dirname(getDbFile()), name), `${current}\n`);
      } catch {
        // Tmpdir copy above is the guaranteed one.
      }
    } catch (err) {
      // Empty DB on first import: nothing to back up.
      console.error(
        `Pre-import backup skipped: ${err instanceof Error ? err.message : err}`,
      );
    }
    await importValidated(validated);
    await refreshSeo(validated.siteRow.siteUrl);
    return { ok: true as const, counts: validated.counts, backup };
  });

export const exportJsonFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireAdmin();
    return stringifySeed(await exportSeedObject());
  },
);
