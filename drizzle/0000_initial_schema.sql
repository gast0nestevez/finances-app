CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`rate` real NOT NULL,
	`source` text NOT NULL,
	CONSTRAINT "exchange_rates_rate_positive" CHECK("exchange_rates"."rate" > 0),
	CONSTRAINT "exchange_rates_source" CHECK("exchange_rates"."source" IN ('api', 'manual'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchange_rates_date_unique` ON `exchange_rates` (`date`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`category_id` integer,
	`rate_at_registration` real NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "expenses_amount_positive" CHECK("expenses"."amount_cents" > 0),
	CONSTRAINT "expenses_currency" CHECK("expenses"."currency" IN ('ARS', 'USD')),
	CONSTRAINT "expenses_rate_positive" CHECK("expenses"."rate_at_registration" > 0),
	CONSTRAINT "expenses_date_format" CHECK("expenses"."date" GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]')
);
--> statement-breakpoint
CREATE TABLE `fixed_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	CONSTRAINT "fixed_expenses_amount_positive" CHECK("fixed_expenses"."amount_cents" > 0),
	CONSTRAINT "fixed_expenses_currency" CHECK("fixed_expenses"."currency" IN ('ARS', 'USD'))
);
--> statement-breakpoint
CREATE TABLE `income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`amount_cents` integer NOT NULL,
	CONSTRAINT "income_month_format" CHECK("income"."month" GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
	CONSTRAINT "income_amount_non_negative" CHECK("income"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `income_month_unique` ON `income` (`month`);--> statement-breakpoint
CREATE TABLE `investment_goal` (
	`id` integer PRIMARY KEY NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	CONSTRAINT "investment_goal_single_row" CHECK("investment_goal"."id" = 1),
	CONSTRAINT "investment_goal_currency" CHECK("investment_goal"."currency" IN ('ARS', 'USD')),
	CONSTRAINT "investment_goal_amount_non_negative" CHECK("investment_goal"."amount_cents" >= 0)
);
