import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import { categories, exchangeRates, expenses, fixedExpenses, income, investmentGoal } from "./schema.ts";

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

  it("rejects non positive expense amounts", () => {
    expect(() =>
      database
        .insert(fixedExpenses)
        .values({ name: "Rent", amountCents: 0, currency: "ARS" })
        .run(),
    ).toThrow();
  });

  it("rejects unsupported currencies at SQL level", () => {
    expect(() =>
      database.$client
        .prepare("INSERT INTO fixed_expenses (name, amount_cents, currency) VALUES ('X', 100, 'EUR')")
        .run(),
    ).toThrow();
  });

  it("keeps a single investment goal row", () => {
    database.insert(investmentGoal).values({ id: 1, amountCents: 50_000, currency: "USD" }).run();
    expect(() =>
      database.insert(investmentGoal).values({ id: 2, amountCents: 1, currency: "USD" }).run(),
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
