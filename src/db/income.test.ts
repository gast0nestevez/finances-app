import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import { findIncomeForMonth, saveIncome } from "./income.ts";
import { cents, money } from "../lib/money.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("income repository", () => {
  it("returns null when no income exists", () => {
    expect(findIncomeForMonth(database, "2026-11")).toBeNull();
  });

  it("returns the income saved for the month", () => {
    saveIncome(database, "2026-11", cents(2_000_000_00));
    expect(findIncomeForMonth(database, "2026-11")).toEqual({
      month: "2026-11",
      amount: money(2_000_000_00, "ARS"),
      inherited: false,
    });
  });

  it("inherits the latest previous income", () => {
    saveIncome(database, "2026-09", cents(1_500_000_00));
    saveIncome(database, "2026-10", cents(1_800_000_00));
    expect(findIncomeForMonth(database, "2026-12")).toEqual({
      month: "2026-10",
      amount: money(1_800_000_00, "ARS"),
      inherited: true,
    });
  });

  it("does not use future incomes", () => {
    saveIncome(database, "2027-01", cents(3_000_000_00));
    expect(findIncomeForMonth(database, "2026-12")).toBeNull();
  });

  it("overwrites the income of an existing month", () => {
    saveIncome(database, "2026-11", cents(100));
    saveIncome(database, "2026-11", cents(200));
    expect(findIncomeForMonth(database, "2026-11")?.amount).toEqual(money(200, "ARS"));
  });
});
