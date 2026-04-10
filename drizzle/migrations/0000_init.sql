CREATE TABLE `sites` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `domain` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `site_id` text NOT NULL,
  `session_id` text NOT NULL,
  `visitor_id` text NOT NULL,
  `type` text NOT NULL,
  `name` text,
  `url` text NOT NULL,
  `path` text NOT NULL,
  `referrer` text,
  `referrer_domain` text,
  `utm_source` text,
  `utm_medium` text,
  `utm_campaign` text,
  `country` text,
  `region` text,
  `city` text,
  `device` text,
  `browser` text,
  `os` text,
  `screen_w` integer,
  `screen_h` integer,
  `lang` text,
  `duration` integer,
  `timestamp` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_events_site_ts` ON `events` (`site_id`,`timestamp`);
--> statement-breakpoint
CREATE INDEX `idx_events_site_session` ON `events` (`site_id`,`session_id`);
--> statement-breakpoint
CREATE INDEX `idx_events_site_type` ON `events` (`site_id`,`type`);
