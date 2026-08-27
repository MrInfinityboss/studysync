CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`sessionId` int,
	`eventType` varchar(64) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('active','cancelled') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`cancelledAt` timestamp,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_session_user_unique` UNIQUE(`sessionId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`type` enum('joined','waitlisted','promoted','cancelled','updated','reminder') NOT NULL,
	`message` varchar(255) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`userId` int NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`bio` text,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`studyInterests` text,
	`avatarUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `sessionTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `sessionTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_tag_unique` UNIQUE(`sessionId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `studySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`subject` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`location` varchar(255),
	`onlineLink` varchar(500),
	`format` enum('in_person','online','hybrid') NOT NULL DEFAULT 'in_person',
	`capacity` int NOT NULL,
	`seatsTaken` int NOT NULL DEFAULT 0,
	`status` enum('draft','published','cancelled','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studySessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(48) NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `waitlistEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`position` int NOT NULL,
	`status` enum('waiting','promoted','cancelled') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waitlistEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `waitlist_session_user_unique` UNIQUE(`sessionId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `auditEvents` ADD CONSTRAINT `auditEvents_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditEvents` ADD CONSTRAINT `auditEvents_sessionId_studySessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `studySessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_sessionId_studySessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `studySessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_sessionId_studySessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `studySessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessionTags` ADD CONSTRAINT `sessionTags_sessionId_studySessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `studySessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessionTags` ADD CONSTRAINT `sessionTags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studySessions` ADD CONSTRAINT `studySessions_hostId_users_id_fk` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlistEntries` ADD CONSTRAINT `waitlistEntries_sessionId_studySessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `studySessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `waitlistEntries` ADD CONSTRAINT `waitlistEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `enrollments_session_idx` ON `enrollments` (`sessionId`,`status`);--> statement-breakpoint
CREATE INDEX `enrollments_user_idx` ON `enrollments` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `sessions_host_idx` ON `studySessions` (`hostId`);--> statement-breakpoint
CREATE INDEX `sessions_discovery_idx` ON `studySessions` (`status`,`startsAt`);--> statement-breakpoint
CREATE INDEX `sessions_subject_idx` ON `studySessions` (`subject`);--> statement-breakpoint
CREATE INDEX `waitlist_order_idx` ON `waitlistEntries` (`sessionId`,`status`,`position`);