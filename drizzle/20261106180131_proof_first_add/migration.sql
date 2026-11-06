ALTER TABLE `experience` ADD `project` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `availability` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `built` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `flow` text DEFAULT '[]' NOT NULL;