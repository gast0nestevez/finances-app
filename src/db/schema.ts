import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("categories_name_unique").on(table.name)],
);

const income = sqliteTable(
  "income",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    month: text("month").notNull(),
    amountCents: integer("amount_cents").notNull(),
  },
  (table) => [
    uniqueIndex("income_month_unique").on(table.month),
    check("income_month_format", sql`${table.month} GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'`),
    check("income_amount_non_negative", sql`${table.amountCents} >= 0`),
  ],
);

const fixedExpenses = sqliteTable("fixed_expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
});

const fixedExpenseVersions = sqliteTable(
  "fixed_expense_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fixedExpenseId: integer("fixed_expense_id")
      .notNull()
      .references(() => fixedExpenses.id, { onDelete: "cascade" }),
    fromMonth: text("from_month").notNull(),
    name: text("name").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency", { enum: ["ARS", "USD"] }).notNull(),
    active: integer("active", { mode: "boolean" }).notNull(),
  },
  (table) => [
    uniqueIndex("fixed_expense_versions_unique").on(table.fixedExpenseId, table.fromMonth),
    check(
      "fixed_expense_versions_month_format",
      sql`${table.fromMonth} GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'`,
    ),
    check("fixed_expense_versions_amount_positive", sql`${table.amountCents} > 0`),
    check("fixed_expense_versions_currency", sql`${table.currency} IN ('ARS', 'USD')`),
  ],
);

const investmentGoals = sqliteTable(
  "investment_goals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    month: text("month").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency", { enum: ["ARS", "USD"] }).notNull(),
  },
  (table) => [
    uniqueIndex("investment_goals_month_unique").on(table.month),
    check("investment_goals_month_format", sql`${table.month} GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'`),
    check("investment_goals_amount_non_negative", sql`${table.amountCents} >= 0`),
    check("investment_goals_currency", sql`${table.currency} IN ('ARS', 'USD')`),
  ],
);

const expenses = sqliteTable(
  "expenses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency", { enum: ["ARS", "USD"] }).notNull(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    rateAtRegistration: real("rate_at_registration").notNull(),
  },
  (table) => [
    check("expenses_amount_positive", sql`${table.amountCents} > 0`),
    check("expenses_currency", sql`${table.currency} IN ('ARS', 'USD')`),
    check("expenses_rate_positive", sql`${table.rateAtRegistration} > 0`),
    check(
      "expenses_date_format",
      sql`${table.date} GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`,
    ),
  ],
);

const exchangeRates = sqliteTable(
  "exchange_rates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    rate: real("rate").notNull(),
    source: text("source", { enum: ["api", "manual"] }).notNull(),
  },
  (table) => [
    uniqueIndex("exchange_rates_date_unique").on(table.date),
    check("exchange_rates_rate_positive", sql`${table.rate} > 0`),
    check("exchange_rates_source", sql`${table.source} IN ('api', 'manual')`),
  ],
);

export {
  categories,
  exchangeRates,
  expenses,
  fixedExpenses,
  fixedExpenseVersions,
  income,
  investmentGoals,
};
