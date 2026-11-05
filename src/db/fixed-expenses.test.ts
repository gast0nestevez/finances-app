import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import {
  createFixedExpense,
  deleteFixedExpense,
  listActiveFixedExpensesForMonth,
  listFixedExpensesForMonth,
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
    const created = createFixedExpense(database, { name: "Claude", amount: money(20_00, "USD") }, "2026-11");
    expect(created).toEqual({ id: created.id, name: "Claude", amount: money(20_00, "USD"), active: true });
  });

  it("does not show an expense in months before it started", () => {
    createFixedExpense(database, { name: "Gym", amount: money(100, "ARS") }, "2026-11");
    expect(listFixedExpensesForMonth(database, "2026-10")).toEqual([]);
    expect(listFixedExpensesForMonth(database, "2026-11")).toHaveLength(1);
    expect(listFixedExpensesForMonth(database, "2027-03")).toHaveLength(1);
  });

  it("keeps past months untouched when the amount changes", () => {
    const rent = createFixedExpense(database, { name: "Rent", amount: money(500_000_00, "ARS") }, "2026-01");
    updateFixedExpense(database, rent.id, { name: "Rent", amount: money(650_000_00, "ARS") }, "2026-07");
    expect(listFixedExpensesForMonth(database, "2026-06")[0]?.amount).toEqual(money(500_000_00, "ARS"));
    expect(listFixedExpensesForMonth(database, "2026-07")[0]?.amount).toEqual(money(650_000_00, "ARS"));
    expect(listFixedExpensesForMonth(database, "2026-12")[0]?.amount).toEqual(money(650_000_00, "ARS"));
  });

  it("keeps past names when an expense is renamed", () => {
    const expense = createFixedExpense(database, { name: "Gym", amount: money(100, "ARS") }, "2026-01");
    updateFixedExpense(database, expense.id, { name: "Pool", amount: money(100, "ARS") }, "2026-05");
    expect(listFixedExpensesForMonth(database, "2026-04")[0]?.name).toBe("Gym");
    expect(listFixedExpensesForMonth(database, "2026-05")[0]?.name).toBe("Pool");
  });

  it("overwrites the version of the same month on repeated edits", () => {
    const expense = createFixedExpense(database, { name: "Gym", amount: money(100, "ARS") }, "2026-11");
    updateFixedExpense(database, expense.id, { name: "Gym", amount: money(200, "ARS") }, "2026-11");
    updateFixedExpense(database, expense.id, { name: "Gym", amount: money(300, "ARS") }, "2026-11");
    expect(listFixedExpensesForMonth(database, "2026-11")[0]?.amount).toEqual(money(300, "ARS"));
  });

  it("deactivates from a month onwards without rewriting the past", () => {
    const rent = createFixedExpense(database, { name: "Rent", amount: money(100, "ARS") }, "2026-01");
    setFixedExpenseActive(database, rent.id, false, "2026-08");
    expect(listActiveFixedExpensesForMonth(database, "2026-07")).toHaveLength(1);
    expect(listActiveFixedExpensesForMonth(database, "2026-08")).toHaveLength(0);
    expect(listFixedExpensesForMonth(database, "2026-09")).toHaveLength(1);
  });

  it("supports reactivating after a gap", () => {
    const rent = createFixedExpense(database, { name: "Rent", amount: money(100, "ARS") }, "2026-01");
    setFixedExpenseActive(database, rent.id, false, "2026-03");
    setFixedExpenseActive(database, rent.id, true, "2026-06");
    const activeMonths = ["2026-02", "2026-04", "2026-07"].map(
      (month) => listActiveFixedExpensesForMonth(database, month).length,
    );
    expect(activeMonths).toEqual([1, 0, 1]);
  });

  it("keeps the active flag when the amount changes", () => {
    const rent = createFixedExpense(database, { name: "Rent", amount: money(100, "ARS") }, "2026-01");
    setFixedExpenseActive(database, rent.id, false, "2026-03");
    updateFixedExpense(database, rent.id, { name: "Rent", amount: money(150, "ARS") }, "2026-05");
    expect(listFixedExpensesForMonth(database, "2026-05")[0]?.active).toBe(false);
  });

  it("refuses to edit an expense in a month before it existed", () => {
    const expense = createFixedExpense(database, { name: "Gym", amount: money(100, "ARS") }, "2026-11");
    expect(() =>
      updateFixedExpense(database, expense.id, { name: "Gym", amount: money(1, "ARS") }, "2026-01"),
    ).toThrow("does not exist");
  });

  it("deletes an expense together with its whole history", () => {
    const expense = createFixedExpense(database, { name: "Gym", amount: money(100, "ARS") }, "2026-01");
    updateFixedExpense(database, expense.id, { name: "Gym", amount: money(200, "ARS") }, "2026-06");
    deleteFixedExpense(database, expense.id);
    expect(listFixedExpensesForMonth(database, "2026-03")).toEqual([]);
    expect(listFixedExpensesForMonth(database, "2026-12")).toEqual([]);
  });

  it("sorts expenses by name", () => {
    createFixedExpense(database, { name: "Netflix", amount: money(1, "ARS") }, "2026-01");
    createFixedExpense(database, { name: "Alquiler", amount: money(1, "ARS") }, "2026-01");
    expect(listFixedExpensesForMonth(database, "2026-01").map((expense) => expense.name)).toEqual([
      "Alquiler",
      "Netflix",
    ]);
  });
});
