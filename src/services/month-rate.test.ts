import { beforeEach, describe, expect, it } from "vitest";
import { createMigratedDatabase } from "../db/client.ts";
import type { AppDatabase } from "../db/client.ts";
import { saveRate } from "../db/exchange-rates.ts";
import { exchangeRate } from "../lib/money.ts";
import type { CurrentRate } from "./exchange-rate-service.ts";
import { resolveMonthRate } from "./month-rate.ts";

const current: CurrentRate = { rate: exchangeRate(1600), date: "2026-11-04", source: "api", stale: false };

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
  saveRate(database, { date: "2026-09-20", rate: exchangeRate(1400), source: "api" });
  saveRate(database, { date: "2026-10-30", rate: exchangeRate(1500), source: "api" });
});

describe("resolveMonthRate", () => {
  it("uses the current rate for the current month", () => {
    expect(resolveMonthRate({ database, month: "2026-11", currentMonth: "2026-11", current })).toEqual({
      ...current,
      historical: false,
    });
  });

  it("uses the current rate for future months", () => {
    expect(resolveMonthRate({ database, month: "2027-02", currentMonth: "2026-11", current })?.rate).toBe(1600);
  });

  it("uses the last stored rate of a past month", () => {
    expect(resolveMonthRate({ database, month: "2026-10", currentMonth: "2026-11", current })).toEqual({
      rate: 1500,
      date: "2026-10-30",
      source: "api",
      stale: false,
      historical: true,
    });
    expect(resolveMonthRate({ database, month: "2026-09", currentMonth: "2026-11", current })?.rate).toBe(1400);
  });

  it("falls back to the current rate when nothing was stored up to that month", () => {
    expect(resolveMonthRate({ database, month: "2026-01", currentMonth: "2026-11", current })).toEqual({
      ...current,
      historical: false,
    });
  });

  it("still resolves historical months without a current rate", () => {
    expect(resolveMonthRate({ database, month: "2026-10", currentMonth: "2026-11", current: null })?.rate).toBe(1500);
  });

  it("returns null when no rate can be resolved", () => {
    expect(resolveMonthRate({ database, month: "2026-01", currentMonth: "2026-11", current: null })).toBeNull();
  });
});
