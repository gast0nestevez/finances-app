CREATE TABLE `fixed_expense_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fixed_expense_id` integer NOT NULL,
	`from_month` text NOT NULL,
	`name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`active` integer NOT NULL,
	FOREIGN KEY (`fixed_expense_id`) REFERENCES `fixed_expenses`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "fixed_expense_versions_month_format" CHECK("fixed_expense_versions"."from_month" GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
	CONSTRAINT "fixed_expense_versions_amount_positive" CHECK("fixed_expense_versions"."amount_cents" > 0),
	CONSTRAINT "fixed_expense_versions_currency" CHECK("fixed_expense_versions"."currency" IN ('ARS', 'USD'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fixed_expense_versions_unique` ON `fixed_expense_versions` (`fixed_expense_id`,`from_month`);--> statement-breakpoint
CREATE TABLE `investment_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	CONSTRAINT "investment_goals_month_format" CHECK("investment_goals"."month" GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
	CONSTRAINT "investment_goals_amount_non_negative" CHECK("investment_goals"."amount_cents" >= 0),
	CONSTRAINT "investment_goals_currency" CHECK("investment_goals"."currency" IN ('ARS', 'USD'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_goals_month_unique` ON `investment_goals` (`month`);
--> statement-breakpoint
INSERT INTO `fixed_expense_versions` (`fixed_expense_id`, `from_month`, `name`, `amount_cents`, `currency`, `active`)
SELECT `id`, '0001-01', `name`, `amount_cents`, `currency`, `active` FROM `fixed_expenses`;--> statement-breakpoint
INSERT INTO `investment_goals` (`month`, `amount_cents`, `currency`)
SELECT '0001-01', `amount_cents`, `currency` FROM `investment_goal`;
