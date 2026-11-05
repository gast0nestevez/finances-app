import { beforeEach, describe, expect, it } from "vitest";
import { addCategory, deleteCategory } from "./categories.ts";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import { createExpense, deleteExpense, listExpensesByMonth, updateExpense } from "./expenses.ts";
import { exchangeRate, money } from "../lib/money.ts";

let database: AppDatabase;

const rate = exchangeRate(1500);

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("expenses repository", () => {
  it("lists only the expenses of the requested month, newest first", () => {
    createExpense(database, { date: "2026-10-31", description: "Old", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    createExpense(database, { date: "2026-11-01", description: "First", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    createExpense(database, { date: "2026-11-30", description: "Last", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    createExpense(database, { date: "2026-12-01", description: "Future", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    expect(listExpensesByMonth(database, "2026-11").map((expense) => expense.description)).toEqual(["Last", "First"]);
  });

  it("handles the december to january boundary", () => {
    createExpense(database, { date: "2026-12-31", description: "NYE", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    createExpense(database, { date: "2027-01-01", description: "NY", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    expect(listExpensesByMonth(database, "2026-12").map((expense) => expense.description)).toEqual(["NYE"]);
  });

  it("includes the category name and survives its deletion", () => {
    const category = addCategory(database, "Food");
    createExpense(database, { date: "2026-11-04", description: "Lunch", amount: money(5_000_00, "ARS"), categoryId: category.id, rateAtRegistration: rate });
    expect(listExpensesByMonth(database, "2026-11")[0]?.categoryName).toBe("Food");
    deleteCategory(database, category.id);
    const [expense] = listExpensesByMonth(database, "2026-11");
    expect(expense?.categoryId).toBeNull();
    expect(expense?.categoryName).toBeNull();
  });

  it("keeps currency and rate at registration", () => {
    createExpense(database, { date: "2026-11-04", description: "Claude", amount: money(20_00, "USD"), categoryId: null, rateAtRegistration: rate });
    const [expense] = listExpensesByMonth(database, "2026-11");
    expect(expense?.amount).toEqual(money(20_00, "USD"));
    expect(expense?.rateAtRegistration).toBe(1500);
  });

  it("deletes an expense", () => {
    createExpense(database, { date: "2026-11-04", description: "Lunch", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
    const [expense] = listExpensesByMonth(database, "2026-11");
    if (expense === undefined) {
      throw new Error("Expense was not created");
    }
    deleteExpense(database, expense.id);
    expect(listExpensesByMonth(database, "2026-11")).toEqual([]);
  });

  describe("updateExpense", () => {
    const createLunch = () => {
      createExpense(database, { date: "2026-11-04", description: "Lunch", amount: money(5_000_00, "ARS"), categoryId: null, rateAtRegistration: rate });
      const [expense] = listExpensesByMonth(database, "2026-11");
      if (expense === undefined) {
        throw new Error("Expense was not created");
      }
      return expense;
    };

    it("changes every editable field and keeps the registration rate", () => {
      const category = addCategory(database, "Food");
      const expense = createLunch();
      updateExpense(database, expense.id, {
        date: "2026-11-10",
        description: "Dinner",
        amount: money(30_00, "USD"),
        categoryId: category.id,
      });
      const [updated] = listExpensesByMonth(database, "2026-11");
      expect(updated).toEqual({
        id: expense.id,
        date: "2026-11-10",
        description: "Dinner",
        amount: money(30_00, "USD"),
        categoryId: category.id,
        categoryName: "Food",
        rateAtRegistration: rate,
      });
    });

    it("removes the category when set to null", () => {
      const category = addCategory(database, "Food");
      createExpense(database, { date: "2026-11-04", description: "Lunch", amount: money(100, "ARS"), categoryId: category.id, rateAtRegistration: rate });
      const [expense] = listExpensesByMonth(database, "2026-11");
      if (expense === undefined) {
        throw new Error("Expense was not created");
      }
      updateExpense(database, expense.id, { date: "2026-11-04", description: "Lunch", amount: money(100, "ARS"), categoryId: null });
      expect(listExpensesByMonth(database, "2026-11")[0]?.categoryName).toBeNull();
    });

    it("moves the expense to another month when the date changes", () => {
      const expense = createLunch();
      updateExpense(database, expense.id, { date: "2026-12-02", description: "Lunch", amount: money(5_000_00, "ARS"), categoryId: null });
      expect(listExpensesByMonth(database, "2026-11")).toEqual([]);
      expect(listExpensesByMonth(database, "2026-12")).toHaveLength(1);
    });

    it("does not touch other expenses", () => {
      const expense = createLunch();
      createExpense(database, { date: "2026-11-05", description: "Other", amount: money(100, "ARS"), categoryId: null, rateAtRegistration: rate });
      updateExpense(database, expense.id, { date: "2026-11-04", description: "Changed", amount: money(1, "ARS"), categoryId: null });
      const descriptions = listExpensesByMonth(database, "2026-11").map((item) => item.description);
      expect(descriptions).toEqual(["Other", "Changed"]);
    });

    it("fails when the expense does not exist", () => {
      expect(() =>
        updateExpense(database, 999, { date: "2026-11-04", description: "x", amount: money(1, "ARS"), categoryId: null }),
      ).toThrow("does not exist");
    });

    it("rejects invalid values at SQL level", () => {
      const expense = createLunch();
      expect(() =>
        updateExpense(database, expense.id, { date: "2026-11-04", description: "x", amount: money(0, "ARS"), categoryId: null }),
      ).toThrow();
    });
  });
});
