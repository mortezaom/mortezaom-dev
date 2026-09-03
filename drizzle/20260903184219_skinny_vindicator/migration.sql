CREATE TABLE `content_meta` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `experience` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`role` text NOT NULL,
	`company` text NOT NULL,
	`period` text NOT NULL,
	`start_date` text NOT NULL,
	`description` text NOT NULL,
	`stack` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `footer_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nav_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY,
	`email` text NOT NULL,
	`cv_path` text NOT NULL,
	`hero_name` text NOT NULL,
	`hero_role` text NOT NULL,
	`hero_tagline` text NOT NULL,
	`hero_card_title` text NOT NULL,
	`hero_card_copy` text NOT NULL,
	`about_paragraphs` text NOT NULL,
	`portrait_alt` text NOT NULL,
	`contact_heading` text NOT NULL,
	`contact_copy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`kind` text NOT NULL,
	`category` text,
	`name` text NOT NULL,
	`href` text,
	`description` text,
	`ownership` text,
	`role` text,
	`status` text,
	`link_label` text,
	`technologies` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quick_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`key` text PRIMARY KEY,
	`eyebrow` text,
	`title` text NOT NULL,
	`copy` text
);
--> statement-breakpoint
CREATE TABLE `site` (
	`id` integer PRIMARY KEY,
	`site_url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`social_description` text NOT NULL,
	`og_image` text NOT NULL,
	`author` text NOT NULL,
	`twitter_creator` text NOT NULL,
	`theme_color` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`technologies` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `socials` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`icon` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
