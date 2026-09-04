import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Single-row site identity + SEO (id always 1). */
export const site = sqliteTable('site', {
  id: integer('id').primaryKey(),
  siteUrl: text('site_url').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  socialDescription: text('social_description').notNull(),
  ogImage: text('og_image').notNull(),
  author: text('author').notNull(),
  twitterCreator: text('twitter_creator').notNull(),
  themeColor: text('theme_color').notNull(),
  trackingSnippet: text('tracking_snippet'),
});

/** Single-row hero/about/contact copy (id always 1). */
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  cvPath: text('cv_path').notNull(),
  heroName: text('hero_name').notNull(),
  heroRole: text('hero_role').notNull(),
  heroTagline: text('hero_tagline').notNull(),
  heroCardTitle: text('hero_card_title').notNull(),
  heroCardCopy: text('hero_card_copy').notNull(),
  aboutParagraphs: text('about_paragraphs').notNull(),
  portraitAlt: text('portrait_alt').notNull(),
  contactHeading: text('contact_heading').notNull(),
  contactCopy: text('contact_copy').notNull(),
});

/** Editable section headers, keyed by section. */
export const sections = sqliteTable('sections', {
  key: text('key').primaryKey(),
  eyebrow: text('eyebrow'),
  title: text('title').notNull(),
  copy: text('copy'),
});

export const navLinks = sqliteTable('nav_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  href: text('href').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const quickLinks = sqliteTable('quick_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  href: text('href').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const socials = sqliteTable('socials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  href: text('href').notNull(),
  icon: text('icon').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const footerLinks = sqliteTable('footer_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  href: text('href').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const stats = sqliteTable('stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  value: text('value').notNull(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

/** All projects in one table (kind = spotlight | engineering | archive). */
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(),
  category: text('category'),
  name: text('name').notNull(),
  href: text('href'),
  description: text('description'),
  ownership: text('ownership'),
  role: text('role'),
  status: text('status'),
  linkLabel: text('link_label'),
  technologies: text('technologies').notNull().default('[]'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const experience = sqliteTable('experience', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role: text('role').notNull(),
  company: text('company').notNull(),
  period: text('period').notNull(),
  startDate: text('start_date').notNull(),
  description: text('description').notNull(),
  stack: text('stack').notNull().default('[]'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const skillGroups = sqliteTable('skill_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  technologies: text('technologies').notNull().default('[]'),
  sortOrder: integer('sort_order').notNull().default(0),
});

/** Cache-buster, bumped on every mutation. */
export const contentMeta = sqliteTable('content_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
