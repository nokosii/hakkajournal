ALTER TABLE `reviews` ADD `reviewer_user_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `reviewer_name` text DEFAULT '會員' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `submitter_user_id` text DEFAULT '' NOT NULL;