import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import { findInvestmentGoalForMonth, saveInvestmentGoal } from "./investment-goal.ts";
import { money } from "../lib/money.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("investment goal repository", () => {
  it("returns null when no goal is set", () => {
    expect(findInvestmentGoalForMonth(database, "2026-11")).toBeNull();
  });

  it("returns the goal saved for the month", () => {
    saveInvestmentGoal(database, "2026-11", money(500_00, "USD"));
    expect(findInvestmentGoalForMonth(database, "2026-11")).toEqual({
      month: "2026-11",
      goal: money(500_00, "USD"),
      inherited: false,
    });
  });

  it("inherits the latest previous goal and ignores future ones", () => {
    saveInvestmentGoal(database, "2026-03", money(300_00, "USD"));
    saveInvestmentGoal(database, "2026-09", money(500_00, "USD"));
    expect(findInvestmentGoalForMonth(database, "2026-05")?.goal).toEqual(money(300_00, "USD"));
    expect(findInvestmentGoalForMonth(database, "2026-12")).toEqual({
      month: "2026-09",
      goal: money(500_00, "USD"),
      inherited: true,
    });
    expect(findInvestmentGoalForMonth(database, "2026-02")).toBeNull();
  });

  it("overwrites the goal of an existing month, including its currency", () => {
    saveInvestmentGoal(database, "2026-11", money(500_00, "USD"));
    saveInvestmentGoal(database, "2026-11", money(600_000_00, "ARS"));
    expect(findInvestmentGoalForMonth(database, "2026-11")?.goal).toEqual(money(600_000_00, "ARS"));
  });
});
