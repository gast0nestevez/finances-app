DROP TABLE `investment_goal`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_fixed_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_fixed_expenses`("id") SELECT "id" FROM `fixed_expenses`;--> statement-breakpoint
DROP TABLE `fixed_expenses`;--> statement-breakpoint
ALTER TABLE `__new_fixed_expenses` RENAME TO `fixed_expenses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;