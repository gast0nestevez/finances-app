import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import {
  categories,
  exchangeRates,
  expenses,
  fixedExpenses,
  fixedExpenseVersions,
  income,
  investmentGoals,
} from "./schema.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createDatabase(":memory:");
  migrate(database, { migrationsFolder: "drizzle" });
});

describe("schema constraints", () => {
  it("rejects a second income entry for the same month", () => {
    database.insert(income).values({ month: "2026-11", amountCents: 100 }).run();
    expect(() => database.insert(income).values({ month: "2026-11", amountCents: 200 }).run()).toThrow();
  });

  it("rejects malformed months and dates", () => {
    expect(() => database.insert(income).values({ month: "11-2026", amountCents: 100 }).run()).toThrow();
    expect(() =>
      database
        .insert(expenses)
        .values({
          date: "04/11/2026",
          description: "Lunch",
          amountCents: 100,
          currency: "ARS",
          categoryId: null,
          rateAtRegistration: 1000,
        })
        .run(),
    ).toThrow();
  });

  it("rejects non positive fixed expense amounts", () => {
    const created = database.insert(fixedExpenses).values({}).returning().get();
    expect(() =>
      database
        .insert(fixedExpenseVersions)
        .values({ fixedExpenseId: created.id, fromMonth: "2026-11", name: "Rent", amountCents: 0, currency: "ARS", active: true })
        .run(),
    ).toThrow();
  });

  it("rejects unsupported currencies at SQL level", () => {
    const created = database.insert(fixedExpenses).values({}).returning().get();
    expect(() =>
      database.$client
        .prepare(
          "INSERT INTO fixed_expense_versions (fixed_expense_id, from_month, name, amount_cents, currency, active) VALUES (?, '2026-11', 'X', 100, 'EUR', 1)",
        )
        .run(created.id),
    ).toThrow();
  });

  it("rejects two versions of the same expense for the same month", () => {
    const created = database.insert(fixedExpenses).values({}).returning().get();
    const version = { fixedExpenseId: created.id, fromMonth: "2026-11", name: "Rent", amountCents: 100, currency: "ARS" as const, active: true };
    database.insert(fixedExpenseVersions).values(version).run();
    expect(() => database.insert(fixedExpenseVersions).values(version).run()).toThrow();
  });

  it("rejects versions that reference a missing fixed expense", () => {
    expect(() =>
      database
        .insert(fixedExpenseVersions)
        .values({ fixedExpenseId: 999, fromMonth: "2026-11", name: "Rent", amountCents: 100, currency: "ARS", active: true })
        .run(),
    ).toThrow();
  });

  it("keeps one investment goal per month", () => {
    database.insert(investmentGoals).values({ month: "2026-11", amountCents: 50_000, currency: "USD" }).run();
    expect(() =>
      database.insert(investmentGoals).values({ month: "2026-11", amountCents: 1, currency: "USD" }).run(),
    ).toThrow();
  });

  it("keeps one exchange rate per day", () => {
    database.insert(exchangeRates).values({ date: "2026-11-04", rate: 1200, source: "api" }).run();
    expect(() =>
      database.insert(exchangeRates).values({ date: "2026-11-04", rate: 1210, source: "manual" }).run(),
    ).toThrow();
  });

  it("nullifies the category of expenses when the category is deleted", () => {
    const [category] = database.insert(categories).values({ name: "Food" }).returning().all();
    if (category === undefined) {
      throw new Error("Category was not created");
    }
    database
      .insert(expenses)
      .values({
        date: "2026-11-04",
        description: "Lunch",
        amountCents: 1000,
        currency: "ARS",
        categoryId: category.id,
        rateAtRegistration: 1200,
      })
      .run();
    database.delete(categories).run();
    const [expense] = database.select().from(expenses).all();
    expect(expense?.categoryId).toBeNull();
  });
});
