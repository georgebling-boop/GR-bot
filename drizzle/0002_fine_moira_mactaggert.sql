CREATE TABLE `hyperliquid_connection` (
	`id` int AUTO_INCREMENT NOT NULL,
	`encryptedPrivateKey` text NOT NULL,
	`walletAddress` varchar(64) NOT NULL,
	`useMainnet` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hyperliquid_connection_id` PRIMARY KEY(`id`)
);
