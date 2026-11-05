import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";
import { findRateForMonth, saveRate } from "./exchange-rates.ts";
import { exchangeRate } from "../lib/money.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("findRateForMonth", () => {
  it("returns null when there are no rates up to that month", () => {
    saveRate(database, { date: "2026-11-05", rate: exchangeRate(1500), source: "api" });
    expect(findRateForMonth(database, "2026-10")).toBeNull();
  });

  it("returns the last rate stored within the month", () => {
    saveRate(database, { date: "2026-10-03", rate: exchangeRate(1400), source: "api" });
    saveRate(database, { date: "2026-10-28", rate: exchangeRate(1450), source: "api" });
    saveRate(database, { date: "2026-11-01", rate: exchangeRate(1500), source: "api" });
    expect(findRateForMonth(database, "2026-10")?.rate).toBe(1450);
  });

  it("falls back to the latest rate of earlier months", () => {
    saveRate(database, { date: "2026-08-15", rate: exchangeRate(1300), source: "manual" });
    expect(findRateForMonth(database, "2026-10")).toEqual({
      date: "2026-08-15",
      rate: 1300,
      source: "manual",
    });
  });

  it("includes the last day of the month and handles year boundaries", () => {
    saveRate(database, { date: "2026-12-31", rate: exchangeRate(1600), source: "api" });
    saveRate(database, { date: "2027-01-01", rate: exchangeRate(1700), source: "api" });
    expect(findRateForMonth(database, "2026-12")?.rate).toBe(1600);
  });
});
