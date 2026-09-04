import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { asc, eq } from 'drizzle-orm';
import { getDb, schema } from './db/client';

export interface SiteContent {
  siteUrl: string;
  title: string;
  description: string;
  socialDescription: string;
  ogImage: string;
  author: string;
  twitterCreator: string;
  themeColor: string;
  trackingSnippet: string | null;
}

export interface ProfileContent {
  email: string;
  cvPath: string;
  heroName: string[];
  heroRole: string;
  heroTagline: string;
  heroCardTitle: string;
  heroCardCopy: string;
  aboutParagraphs: string[];
  portraitAlt: string;
  contactHeading: string;
  contactCopy: string;
}

export interface SectionContent {
  key: string;
  eyebrow: string | null;
  title: string;
  copy: string | null;
}

export interface LinkItem {
  id: number;
  label: string;
  href: string;
  sortOrder: number;
}

export interface SocialItem extends LinkItem {
  icon: string;
}

export interface StatItem {
  id: number;
  value: string;
  label: string;
  sortOrder: number;
}

export interface ProjectItem {
  id: number;
  kind: string;
  category: string | null;
  name: string;
  href: string | null;
  description: string | null;
  ownership: string | null;
  role: string | null;
  status: string | null;
  linkLabel: string | null;
  technologies: string[];
  sortOrder: number;
}

export interface ExperienceItem {
  id: number;
  role: string;
  company: string;
  period: string;
  startDate: string;
  description: string;
  stack: string[];
  sortOrder: number;
}

export interface SkillGroupItem {
  id: number;
  name: string;
  technologies: string[];
  sortOrder: number;
}

export interface PublicContent {
  version: number;
  site: SiteContent;
  profile: ProfileContent;
  sections: Record<string, SectionContent>;
  navLinks: LinkItem[];
  quickLinks: LinkItem[];
  socials: SocialItem[];
  footerLinks: LinkItem[];
  stats: StatItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  skillGroups: SkillGroupItem[];
}

const parseList = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
};

let cache: { version: number; content: PublicContent } | undefined;

export async function getContentVersion(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.contentMeta)
    .where(eq(schema.contentMeta.key, 'content_version'));
  const v = Number(rows[0]?.value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

export async function getPublicContent(): Promise<PublicContent> {
  const version = await getContentVersion().catch(() => 0);
  if (cache && cache.version === version) return cache.content;

  const db = getDb();
  const [
    siteRows,
    profileRows,
    sectionRows,
    navRows,
    quickRows,
    socialRows,
    footerRows,
    statRows,
    projectRows,
    expRows,
    skillRows,
  ] = await Promise.all([
    db.select().from(schema.site),
    db.select().from(schema.profile),
    db.select().from(schema.sections),
    db
      .select()
      .from(schema.navLinks)
      .orderBy(asc(schema.navLinks.sortOrder), asc(schema.navLinks.id)),
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

  const site = siteRows[0];
  const profile = profileRows[0];
  if (!site || !profile)
    throw new Error('Content database is empty. Run: pnpm cms:import');

  const content: PublicContent = {
    version,
    site: {
      siteUrl: site.siteUrl,
      title: site.title,
      description: site.description,
      socialDescription: site.socialDescription,
      ogImage: site.ogImage,
      author: site.author,
      twitterCreator: site.twitterCreator,
      themeColor: site.themeColor,
      trackingSnippet: site.trackingSnippet ?? null,
    },
    profile: {
      email: profile.email,
      cvPath: profile.cvPath,
      heroName: parseList(profile.heroName),
      heroRole: profile.heroRole,
      heroTagline: profile.heroTagline,
      heroCardTitle: profile.heroCardTitle,
      heroCardCopy: profile.heroCardCopy,
      aboutParagraphs: parseList(profile.aboutParagraphs),
      portraitAlt: profile.portraitAlt,
      contactHeading: profile.contactHeading,
      contactCopy: profile.contactCopy,
    },
    sections: Object.fromEntries(
      sectionRows.map((s) => [
        s.key,
        { key: s.key, eyebrow: s.eyebrow, title: s.title, copy: s.copy },
      ]),
    ),
    navLinks: navRows,
    quickLinks: quickRows,
    socials: socialRows,
    footerLinks: footerRows,
    stats: statRows,
    projects: projectRows.map((p) => ({
      ...p,
      technologies: parseList(p.technologies),
    })),
    experience: expRows.map((e) => ({ ...e, stack: parseList(e.stack) })),
    skillGroups: skillRows.map((g) => ({
      ...g,
      technologies: parseList(g.technologies),
    })),
  };

  cache = { version, content };
  return content;
}

export function invalidateContentCache() {
  cache = undefined;
}

/** Fallback: tracked JSON when the DB file is absent. */
export async function getSeedContent(): Promise<
  Omit<PublicContent, 'version'>
> {
  // `.output/server` ships without `content/`; probe upward too.
  const candidates = [resolve(process.cwd(), 'content/portfolio.json')];
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    let dir: string | undefined = here;
    for (let i = 0; i < 5 && dir; i++) {
      candidates.push(resolve(dir, 'content/portfolio.json'));
      const parent = dirname(dir);
      dir = parent === dir ? undefined : parent;
    }
  } catch {
    // Cwd candidate below still applies.
  }
  let raw: string | undefined;
  let lastErr: unknown;
  for (const file of candidates) {
    try {
      raw = await readFile(file, 'utf8');
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (raw === undefined)
    throw new Error(
      `Seed content not found: ${lastErr instanceof Error ? lastErr.message : lastErr}`,
    );
  const json = JSON.parse(raw) as Record<string, unknown>;
  const withIds = <T>(rows: T[]): (T & { id: number; sortOrder: number })[] =>
    (Array.isArray(rows) ? rows : []).map((r, i) => ({
      // Ids stay generated so a crafted seed can't inject row ids.
      ...(r as T),
      id: i + 1,
      sortOrder: i,
    }));
  const seed = json as {
    site: SiteContent;
    profile: ProfileContent;
    sections: SectionContent[];
    navLinks: Omit<LinkItem, 'id' | 'sortOrder'>[];
    quickLinks: Omit<LinkItem, 'id' | 'sortOrder'>[];
    socials: Omit<SocialItem, 'id' | 'sortOrder'>[];
    footerLinks: Omit<LinkItem, 'id' | 'sortOrder'>[];
    stats: Omit<StatItem, 'id' | 'sortOrder'>[];
    projects: Omit<ProjectItem, 'id' | 'sortOrder'>[];
    experience: Omit<ExperienceItem, 'id' | 'sortOrder'>[];
    skillGroups: Omit<SkillGroupItem, 'id' | 'sortOrder'>[];
  };
  return {
    site: { trackingSnippet: null, ...seed.site },
    profile: seed.profile,
    sections: Object.fromEntries((seed.sections ?? []).map((s) => [s.key, s])),
    navLinks: withIds(seed.navLinks ?? []),
    quickLinks: withIds(seed.quickLinks ?? []),
    socials: withIds(seed.socials ?? []),
    footerLinks: withIds(seed.footerLinks ?? []),
    stats: withIds(seed.stats ?? []),
    projects: withIds(seed.projects ?? []),
    experience: withIds(seed.experience ?? []),
    skillGroups: withIds(seed.skillGroups ?? []),
  };
}
