CREATE TABLE `player_season_metrics` (
	`id` varchar(64) NOT NULL,
	`playerId` varchar(64) NOT NULL,
	`seasonId` varchar(64) NOT NULL,
	`gamesPlayed` int DEFAULT 0,
	`goals` int DEFAULT 0,
	`assists` int DEFAULT 0,
	`skatingRating` int,
	`stickhandlingRating` int,
	`shootingRating` int,
	`passingRating` int,
	`defenseRating` int,
	`hockeyIQRating` int,
	`strengths` text,
	`areasForImprovement` text,
	`overallNotes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `player_season_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`jerseyNumber` int,
	`position` varchar(50),
	`dateOfBirth` timestamp,
	`email` varchar(320),
	`phone` varchar(50),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_feedback` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`playerId` varchar(64),
	`whatWentWell` text,
	`areasForImprovement` text,
	`recommendedDrills` text,
	`feedbackType` enum('individual','team') NOT NULL,
	`generatedBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `video_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_players` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`playerId` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `video_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`videoType` enum('practice','game','drill') NOT NULL,
	`recordedAt` timestamp,
	`seasonId` varchar(64),
	`uploadedBy` varchar(64) NOT NULL,
	`processingStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
