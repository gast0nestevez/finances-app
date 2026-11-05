import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import {
  createFixedExpense,
  deleteFixedExpense,
  listActiveFixedExpenses,
  listFixedExpenses,
  setFixedExpenseActive,
  updateFixedExpense,
} from "./fixed-expenses.ts";
import { money } from "../lib/money.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("fixed expenses repository", () => {
  it("creates active expenses with their currency", () => {
    const created = createFixedExpense(database, { name: "Claude", amount: money(20_00, "USD") });
    expect(created).toEqual({ id: created.id, name: "Claude", amount: money(20_00, "USD"), active: true });
  });

  it("updates name and amount", () => {
    const created = createFixedExpense(database, { name: "Rent", amount: money(500_000_00, "ARS") });
    updateFixedExpense(database, created.id, { name: "Rent", amount: money(600_000_00, "ARS") });
    expect(listFixedExpenses(database)[0]?.amount).toEqual(money(600_000_00, "ARS"));
  });

  it("filters out inactive expenses from the active list", () => {
    const rent = createFixedExpense(database, { name: "Rent", amount: money(100, "ARS") });
    createFixedExpense(database, { name: "Gym", amount: money(200, "ARS") });
    setFixedExpenseActive(database, rent.id, false);
    expect(listActiveFixedExpenses(database).map((expense) => expense.name)).toEqual(["Gym"]);
    expect(listFixedExpenses(database)).toHaveLength(2);
  });

  it("deletes an expense", () => {
    const created = createFixedExpense(database, { name: "Rent", amount: money(100, "ARS") });
    deleteFixedExpense(database, created.id);
    expect(listFixedExpenses(database)).toEqual([]);
  });
});
