import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import { findInvestmentGoal, saveInvestmentGoal } from "./investment-goal.ts";
import { money } from "../lib/money.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("investment goal repository", () => {
  it("returns null when no goal is set", () => {
    expect(findInvestmentGoal(database)).toBeNull();
  });

  it("saves and replaces the single goal", () => {
    saveInvestmentGoal(database, money(500_00, "USD"));
    saveInvestmentGoal(database, money(600_000_00, "ARS"));
    expect(findInvestmentGoal(database)).toEqual(money(600_000_00, "ARS"));
  });
});
