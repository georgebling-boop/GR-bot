CREATE TABLE `ai_brain_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`brainData` text NOT NULL,
	`totalCycles` int NOT NULL DEFAULT 0,
	`totalTrades` int NOT NULL DEFAULT 0,
	`winRate` int NOT NULL DEFAULT 50,
	`patternsLearned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_brain_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backtest_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategy` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`totalTrades` int NOT NULL,
	`winningTrades` int NOT NULL,
	`losingTrades` int NOT NULL,
	`winRate` int NOT NULL,
	`totalProfit` varchar(32) NOT NULL,
	`maxDrawdown` varchar(32) NOT NULL,
	`sharpeRatio` varchar(32) NOT NULL,
	`resultData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backtest_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`strategy` varchar(64) NOT NULL,
	`currentBalance` varchar(32) NOT NULL,
	`totalProfit` varchar(32) NOT NULL DEFAULT '0',
	`totalTrades` int NOT NULL DEFAULT 0,
	`winRate` int NOT NULL DEFAULT 0,
	`rank` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competition_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`channel` enum('email','sms','webhook') NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL,
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`emailEnabled` int NOT NULL DEFAULT 1,
	`smsEnabled` int NOT NULL DEFAULT 0,
	`phoneNumber` varchar(20),
	`webhookUrl` varchar(512),
	`alertOnOpportunity` int NOT NULL DEFAULT 1,
	`alertOnProfit` int NOT NULL DEFAULT 1,
	`alertOnLoss` int NOT NULL DEFAULT 1,
	`alertOnRisk` int NOT NULL DEFAULT 1,
	`minConfidence` int NOT NULL DEFAULT 80,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`quantity` varchar(32) NOT NULL,
	`avgEntryPrice` varchar(32) NOT NULL,
	`currentValue` varchar(32) NOT NULL,
	`profitLoss` varchar(32) NOT NULL,
	`profitLossPercent` varchar(32) NOT NULL,
	`allocationPercent` varchar(32) NOT NULL,
	`targetAllocation` varchar(32) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_holdings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`alertType` enum('opportunity','risk','profit','loss','pattern') NOT NULL,
	`strategy` varchar(64) NOT NULL,
	`confidence` int NOT NULL,
	`message` text NOT NULL,
	`price` varchar(32) NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`strategy` varchar(64) NOT NULL,
	`side` enum('BUY','SELL') NOT NULL,
	`entryPrice` varchar(32) NOT NULL,
	`exitPrice` varchar(32),
	`quantity` varchar(32) NOT NULL,
	`profit` varchar(32),
	`profitPercent` varchar(32),
	`status` enum('OPEN','CLOSED','CANCELLED') NOT NULL,
	`marketState` text,
	`indicators` text,
	`openedAt` timestamp NOT NULL,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_history_tradeId_unique` UNIQUE(`tradeId`)
);
--> statement-breakpoint
CREATE TABLE `trading_competitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`status` enum('pending','running','completed') NOT NULL DEFAULT 'pending',
	`startingBalance` varchar(32) NOT NULL,
	`duration` int NOT NULL,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`winnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_competitions_id` PRIMARY KEY(`id`)
);
