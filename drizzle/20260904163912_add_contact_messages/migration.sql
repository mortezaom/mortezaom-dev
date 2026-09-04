CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`ip` text,
	`user_agent` text,
	`origin` text,
	`is_spam` integer DEFAULT 0 NOT NULL,
	`spam_reason` text,
	`created_at` integer NOT NULL
);
