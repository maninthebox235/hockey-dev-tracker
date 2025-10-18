CREATE TABLE `videoAnalysisResults` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`status` enum('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
	`progress` int NOT NULL DEFAULT 0,
	`currentFrame` int,
	`totalFrames` int,
	`message` text,
	`analysisData` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `videoAnalysisResults_id` PRIMARY KEY(`id`)
);
