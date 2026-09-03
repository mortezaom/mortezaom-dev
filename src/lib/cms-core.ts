// Shared CMS core: validation + import/export used by both the CLI and admin panel.
// Server-only (imports the Turso client).
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { asc } from 'drizzle-orm';
import { invalidateContentCache } from './content';
import { getDb, schema } from './db/client';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

/* ---------- validation ---------- */

export interface ValidatedSeed {
  siteRow: typeof schema.site.$inferInsert;
  profileRow: typeof schema.profile.$inferInsert;
  sectionRows: (typeof schema.sections.$inferInsert)[];
  navRows: (typeof schema.navLinks.$inferInsert)[];
  quickRows: (typeof schema.quickLinks.$inferInsert)[];
  socialRows: (typeof schema.socials.$inferInsert)[];
  footerRows: (typeof schema.footerLinks.$inferInsert)[];
  statRows: (typeof schema.stats.$inferInsert)[];
  projectRows: (typeof schema.projects.$inferInsert)[];
  expRows: (typeof schema.experience.$inferInsert)[];
  skillRows: (typeof schema.skillGroups.$inferInsert)[];
  counts: Record<string, number>;
}

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const MAX_TEXT = 5000;
const MAX_URL = 2000;
const req = (v: unknown, what: string, max = MAX_TEXT): string => {
  if (typeof v !== 'string' || !v)
    throw new Error(`Invalid content: ${what} is required`);
  if (v.length > max)
    throw new Error(`Invalid content: ${what} exceeds ${max} chars`);
  return v;
};

/**
 * Link href allowlist: relative paths/anchors, http(s), mailto.
 * Blocks `javascript:`, `data:`, `vbscript:` etc. (stored XSS via href).
 */
export function assertSafeHref(href: string, what: string): string {
  if (href.length > MAX_URL)
    throw new Error(`Invalid content: ${what} exceeds ${MAX_URL} chars`);
  const lower = href.trim().toLowerCase();
  if (
    href.startsWith('#') ||
    href.startsWith('/') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:')
  ) {
    return href;
  }
  throw new Error(
    `Invalid content: ${what} must be a relative, anchor, http(s), or mailto URL`,
  );
}

const safeLink = (v: unknown, what: string): string =>
  assertSafeHref(req(v, what, MAX_URL), what);

/** Minimal email sanity (admin-entered contact address). */
export function assertEmail(raw: unknown, what: string): string {
  const v = req(raw, what, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    throw new Error(`Invalid content: ${what} must be an email address`);
  return v;
}

/** Site URL must be an absolute http(s) URL (used in SEO files + meta). */
export function assertSiteUrl(raw: unknown, what = 'site.siteUrl'): string {
  const v = req(raw, what, MAX_URL);
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new Error(`Invalid content: ${what} must be an absolute URL`);
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    throw new Error(`Invalid content: ${what} must use http(s)`);
  return v.replace(/\/+$/, '');
}

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
const list = (v: unknown): string =>
  JSON.stringify(
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === 'string' && x.length <= 500)
          .slice(0, 100)
      : [],
  );
const arr = (v: unknown, what: string): Record<string, unknown>[] => {
  if (!Array.isArray(v))
    throw new Error(`Invalid content: ${what} must be an array`);
  return v as Record<string, unknown>[];
};

export function validateSeed(input: unknown): ValidatedSeed {
  const json = input as Record<
    string,
    Record<string, unknown> | Record<string, unknown>[]
  >;
  const site = (json.site ?? {}) as Record<string, unknown>;
  const profile = (json.profile ?? {}) as Record<string, unknown>;
  const linkRows = (key: string) =>
    arr(json[key], key).map((l, i) => ({
      label: req(l.label, `${key}[].label`, 500),
      href: safeLink(l.href, `${key}[].href`),
      sortOrder: i,
    }));
  const optHref = (v: unknown, what: string): string | null => {
    const s = str(v);
    return s ? assertSafeHref(s, what) : null;
  };
  const projectRows = arr(json.projects, 'projects').map((p, i) => {
    const kind = req(p.kind, 'projects[].kind');
    if (!['spotlight', 'engineering', 'archive'].includes(kind)) {
      throw new Error(
        'Invalid content: projects[].kind must be spotlight|engineering|archive',
      );
    }
    return {
      kind,
      category: str(p.category) ?? null,
      name: req(p.name, 'projects[].name'),
      href: optHref(p.href, 'projects[].href'),
      description: str(p.description) ?? null,
      ownership: str(p.ownership) ?? null,
      role: str(p.role) ?? null,
      status: str(p.status) ?? null,
      linkLabel: str(p.linkLabel) ?? null,
      technologies: list(p.technologies),
      sortOrder: i,
    };
  });
  const social = arr(json.socials, 'socials');
  const stats = arr(json.stats, 'stats');
  const exp = arr(json.experience, 'experience');
  const skills = arr(json.skillGroups, 'skillGroups');
  const nav = arr(json.navLinks, 'navLinks');
  const quick = arr(json.quickLinks, 'quickLinks');
  const footer = arr(json.footerLinks, 'footerLinks');
  const sectionRows = arr(json.sections, 'sections').map((s) => ({
    key: req(s.key, 'sections[].key'),
    eyebrow: str(s.eyebrow) ?? null,
    title: req(s.title, 'sections[].title'),
    copy: str(s.copy) ?? null,
  }));

  return {
    siteRow: {
      id: 1,
      siteUrl: assertSiteUrl(site.siteUrl),
      title: req(site.title, 'site.title'),
      description: req(site.description, 'site.description'),
      socialDescription: req(site.socialDescription, 'site.socialDescription'),
      ogImage: req(site.ogImage, 'site.ogImage', MAX_URL),
      author: req(site.author, 'site.author'),
      twitterCreator: req(site.twitterCreator, 'site.twitterCreator'),
      themeColor: req(site.themeColor, 'site.themeColor', 100),
    },
    profileRow: {
      id: 1,
      email: assertEmail(profile.email, 'profile.email'),
      cvPath: safeLink(profile.cvPath, 'profile.cvPath'),
      heroName: list(profile.heroName),
      heroRole: req(profile.heroRole, 'profile.heroRole'),
      heroTagline: req(profile.heroTagline, 'profile.heroTagline'),
      heroCardTitle: req(profile.heroCardTitle, 'profile.heroCardTitle'),
      heroCardCopy: req(profile.heroCardCopy, 'profile.heroCardCopy'),
      aboutParagraphs: list(profile.aboutParagraphs),
      portraitAlt: req(profile.portraitAlt, 'profile.portraitAlt'),
      contactHeading: req(profile.contactHeading, 'profile.contactHeading'),
      contactCopy: req(profile.contactCopy, 'profile.contactCopy'),
    },
    sectionRows,
    navRows: nav.map((l, i) => ({
      label: req(l.label, 'navLinks[].label', 500),
      href: safeLink(l.href, 'navLinks[].href'),
      sortOrder: i,
    })),
    quickRows: quick.map((l, i) => ({
      label: req(l.label, 'quickLinks[].label', 500),
      href: safeLink(l.href, 'quickLinks[].href'),
      sortOrder: i,
    })),
    socialRows: social.map((l, i) => ({
      label: req(l.label, 'socials[].label', 500),
      href: safeLink(l.href, 'socials[].href'),
      icon: req(l.icon, 'socials[].icon', 100),
      sortOrder: i,
    })),
    footerRows: footer.map((l, i) => ({
      label: req(l.label, 'footerLinks[].label', 500),
      href: safeLink(l.href, 'footerLinks[].href'),
      sortOrder: i,
    })),
    statRows: stats.map((s, i) => ({
      value: req(s.value, 'stats[].value'),
      label: req(s.label, 'stats[].label'),
      sortOrder: i,
    })),
    projectRows,
    expRows: exp.map((e, i) => ({
      role: req(e.role, 'experience[].role'),
      company: req(e.company, 'experience[].company'),
      period: req(e.period, 'experience[].period'),
      startDate: req(e.startDate, 'experience[].startDate'),
      description: req(e.description, 'experience[].description'),
      stack: list(e.stack),
      sortOrder: i,
    })),
    skillRows: skills.map((g, i) => ({
      name: req(g.name, 'skillGroups[].name'),
      technologies: list(g.technologies),
      sortOrder: i,
    })),
    counts: {
      sections: sectionRows.length,
      navLinks: linkRows('navLinks').length,
      quickLinks: linkRows('quickLinks').length,
      socials: social.length,
      footerLinks: linkRows('footerLinks').length,
      stats: stats.length,
      projects: projectRows.length,
      experience: exp.length,
      skillGroups: skills.length,
    },
  };
}

/* ---------- import / export ---------- */

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export async function bumpVersion(tx: Tx) {
  const now = Date.now();
  await tx
    .insert(schema.contentMeta)
    .values({ key: 'content_version', value: String(now), updatedAt: now })
    .onConflictDoUpdate({
      target: schema.contentMeta.key,
      set: { value: String(now), updatedAt: now },
    });
}

export async function importValidated(v: ValidatedSeed) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.skillGroups);
    await tx.delete(schema.experience);
    await tx.delete(schema.projects);
    await tx.delete(schema.stats);
    await tx.delete(schema.footerLinks);
    await tx.delete(schema.socials);
    await tx.delete(schema.quickLinks);
    await tx.delete(schema.navLinks);
    await tx.delete(schema.sections);
    await tx.delete(schema.profile);
    await tx.delete(schema.site);

    await tx.insert(schema.site).values(v.siteRow);
    await tx.insert(schema.profile).values(v.profileRow);
    if (v.sectionRows.length)
      await tx.insert(schema.sections).values(v.sectionRows);
    if (v.navRows.length) await tx.insert(schema.navLinks).values(v.navRows);
    if (v.quickRows.length)
      await tx.insert(schema.quickLinks).values(v.quickRows);
    if (v.socialRows.length)
      await tx.insert(schema.socials).values(v.socialRows);
    if (v.footerRows.length)
      await tx.insert(schema.footerLinks).values(v.footerRows);
    if (v.statRows.length) await tx.insert(schema.stats).values(v.statRows);
    if (v.projectRows.length)
      await tx.insert(schema.projects).values(v.projectRows);
    if (v.expRows.length) await tx.insert(schema.experience).values(v.expRows);
    if (v.skillRows.length)
      await tx.insert(schema.skillGroups).values(v.skillRows);
    await bumpVersion(tx);
  });
  invalidateContentCache();
}

export async function exportSeedObject() {
  const db = getDb();
  const byOrder = [asc(schema.navLinks.sortOrder), asc(schema.navLinks.id)];
  const [
    siteRows,
    profileRows,
    sectionRows,
    nav,
    quick,
    social,
    footer,
    st,
    proj,
    exp,
    skills,
  ] = await Promise.all([
    db.select().from(schema.site),
    db.select().from(schema.profile),
    db.select().from(schema.sections),
    db
      .select()
      .from(schema.navLinks)
      .orderBy(...byOrder),
    db
      .select()
      .from(schema.quickLinks)
      .orderBy(asc(schema.quickLinks.sortOrder), asc(schema.quickLinks.id)),
    db
      .select()
      .from(schema.socials)
      .orderBy(asc(schema.socials.sortOrder), asc(schema.socials.id)),
    db
      .select()
      .from(schema.footerLinks)
      .orderBy(asc(schema.footerLinks.sortOrder), asc(schema.footerLinks.id)),
    db
      .select()
      .from(schema.stats)
      .orderBy(asc(schema.stats.sortOrder), asc(schema.stats.id)),
    db
      .select()
      .from(schema.projects)
      .orderBy(asc(schema.projects.sortOrder), asc(schema.projects.id)),
    db
      .select()
      .from(schema.experience)
      .orderBy(asc(schema.experience.sortOrder), asc(schema.experience.id)),
    db
      .select()
      .from(schema.skillGroups)
      .orderBy(asc(schema.skillGroups.sortOrder), asc(schema.skillGroups.id)),
  ]);
  const s = siteRows[0];
  const p = profileRows[0];
  if (!s || !p) throw new Error('Database is empty, nothing to export');
  const J = (raw: string | null) => {
    try {
      return JSON.parse(raw ?? '[]');
    } catch {
      return [];
    }
  };
  return {
    site: {
      siteUrl: s.siteUrl,
      title: s.title,
      description: s.description,
      socialDescription: s.socialDescription,
      ogImage: s.ogImage,
      author: s.author,
      twitterCreator: s.twitterCreator,
      themeColor: s.themeColor,
    },
    profile: {
      email: p.email,
      cvPath: p.cvPath,
      heroName: J(p.heroName),
      heroRole: p.heroRole,
      heroTagline: p.heroTagline,
      heroCardTitle: p.heroCardTitle,
      heroCardCopy: p.heroCardCopy,
      aboutParagraphs: J(p.aboutParagraphs),
      portraitAlt: p.portraitAlt,
      contactHeading: p.contactHeading,
      contactCopy: p.contactCopy,
    },
    sections: sectionRows.map((r) => ({
      key: r.key,
      eyebrow: r.eyebrow,
      title: r.title,
      copy: r.copy,
    })),
    navLinks: nav.map((l) => ({ label: l.label, href: l.href })),
    quickLinks: quick.map((l) => ({ label: l.label, href: l.href })),
    socials: social.map((l) => ({
      label: l.label,
      href: l.href,
      icon: l.icon,
    })),
    footerLinks: footer.map((l) => ({ label: l.label, href: l.href })),
    stats: st.map((x) => ({ value: x.value, label: x.label })),
    projects: proj.map((x) => ({
      kind: x.kind,
      category: x.category,
      name: x.name,
      href: x.href,
      description: x.description,
      ownership: x.ownership,
      role: x.role,
      status: x.status,
      linkLabel: x.linkLabel,
      technologies: J(x.technologies),
    })),
    experience: exp.map((x) => ({
      role: x.role,
      company: x.company,
      period: x.period,
      startDate: x.startDate,
      description: x.description,
      stack: J(x.stack),
    })),
    skillGroups: skills.map((x) => ({
      name: x.name,
      technologies: J(x.technologies),
    })),
  };
}

/**
 * Regenerate public/sitemap.xml + public/robots.txt from the site URL.
 * Throws on invalid URL or write failure — callers decide logging/fallback.
 */
export async function writeSeoFiles(siteUrl: string) {
  const clean = assertSiteUrl(siteUrl);
  // Server runs with cwd = project root (`node .output/server/index.mjs`),
  // but resolve defensively for other launchers.
  const { existsSync } = await import('node:fs');
  const candidates = [
    resolve(process.cwd(), 'public'),
    resolve(process.cwd(), '.output/public'),
  ];
  const dir = candidates.find((d) => existsSync(d));
  if (!dir) throw new Error('public/ directory not found, SEO files skipped');
  const today = new Date().toISOString().slice(0, 10);
  const loc = escapeXml(`${clean}/`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;
  const robots = `# https://www.robotstxt.org/robotstxt.html\nUser-agent: *\nDisallow:\n\nSitemap: ${clean}/sitemap.xml\n`;
  await writeFile(resolve(dir, 'sitemap.xml'), sitemap);
  await writeFile(resolve(dir, 'robots.txt'), robots);
}

/** 2-space JSON, short arrays/objects on one line (matches tracked seed). */
export function stringifySeed(value: unknown): string {
  let pretty = JSON.stringify(value, null, 2);
  pretty = pretty.replace(
    /\[\n((?:\s*"[^"\n]*",?\n)+)\s*\]/g,
    (match, inner: string) => {
      const items = inner
        .split('\n')
        .map((l) => l.trim().replace(/,$/, ''))
        .filter(Boolean);
      if (
        !items.every((l) => /^"[^"]*"$/.test(l)) ||
        items.join(', ').length > 100
      )
        return match;
      return `[${items.join(', ')}]`;
    },
  );
  pretty = pretty.replace(
    /\{\n((?:\s*"[^"\n]+": (?:null|true|false|-?\d[\d.]*|"[^"\n]*"|\[[^\]\n[\]]*\]),?\n)+)\s*\}/g,
    (match, inner: string) => {
      const parts = inner
        .split('\n')
        .map((l) => l.trim().replace(/,$/, ''))
        .filter(Boolean);
      if (
        !parts.every((l) =>
          /^"[^"]+": (?:null|true|false|-?\d[\d.]*|"[^"]*"|\[[^\][\n{}]*\])$/.test(
            l,
          ),
        ) ||
        parts.join(', ').length > 160
      ) {
        return match;
      }
      return `{ ${parts.join(', ')} }`;
    },
  );
  return pretty;
}
