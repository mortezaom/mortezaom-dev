// Server-only single-admin sessions.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
// Revocation cap; oldest evicted first.
const MAX_REVOKED = 1000;

const b64url = (buf: Buffer) => buf.toString('base64url');
const unb64url = (s: string) => Buffer.from(s, 'base64url');

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32)
    throw new Error('ADMIN_SESSION_SECRET must be set (32+ chars)');
  return s;
}

export function signSession(username: string): string {
  const payload = JSON.stringify({
    u: username,
    sid: randomBytes(16).toString('hex'),
    exp: Date.now() + SESSION_TTL_MS,
  });
  const body = b64url(Buffer.from(payload));
  const sig = b64url(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

/** Revoked session ids, in-memory per process. */
const revoked = new Set<string>();

function trackRevoked(sid: string) {
  revoked.add(sid);
  if (revoked.size > MAX_REVOKED) {
    const oldest = revoked.values().next();
    if (!oldest.done) revoked.delete(oldest.value);
  }
}

/** Revoke one token (logout). */
export function revokeSession(token: string | undefined): void {
  const sid = sessionId(token);
  if (sid) trackRevoked(sid);
}

/** Clear revocation state (full rotation happens via secret change). */
export function revokeAllSessions(): void {
  revoked.clear();
}

function sessionId(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  let expected: Buffer;
  try {
    expected = createHmac('sha256', secret()).update(body).digest();
  } catch {
    return null;
  }
  let actual: Buffer;
  try {
    actual = unb64url(sig);
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as { sid?: unknown };
    return typeof payload.sid === 'string' && payload.sid ? payload.sid : null;
  } catch {
    return null;
  }
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  let expected: Buffer;
  try {
    expected = createHmac('sha256', secret()).update(body).digest();
  } catch {
    return null;
  }
  const actual = unb64url(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as {
      u: unknown;
      sid: unknown;
      exp: unknown;
    };
    if (typeof payload.u !== 'string' || !payload.u) return null;
    if (payload.u !== process.env.ADMIN_USERNAME) return null;
    if (typeof payload.sid !== 'string' || !payload.sid) return null;
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp))
      return null;
    if (Date.now() > payload.exp) return null;
    if (revoked.has(payload.sid)) return null;
    return payload.u;
  } catch {
    return null;
  }
}
