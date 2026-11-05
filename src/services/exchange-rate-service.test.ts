import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../db/client.ts";
import type { AppDatabase } from "../db/client.ts";
import { saveRate } from "../db/exchange-rates.ts";
import { exchangeRate } from "../lib/money.ts";
import type { FetchFunction } from "./dolarapi.ts";
import {
  getCurrentRate,
  NoExchangeRateAvailableError,
  setManualRate,
} from "./exchange-rate-service.ts";

const now = () => new Date(2026, 10, 4, 12, 0, 0);

const apiReturning = (venta: number): FetchFunction =>
  vi.fn<FetchFunction>(async () => new Response(JSON.stringify({ venta })));

const apiFailing = (): FetchFunction =>
  vi.fn<FetchFunction>(async () => {
    throw new TypeError("fetch failed");
  });

let database: AppDatabase;

beforeEach(() => {
  database = createDatabase(":memory:");
  migrate(database, { migrationsFolder: "drizzle" });
});

describe("getCurrentRate", () => {
  it("fetches from the API and stores the rate when none exists for today", async () => {
    const fetchFunction = apiReturning(1588.6);
    const current = await getCurrentRate({ database, fetchFunction, now });
    expect(current).toEqual({ rate: 1588.6, date: "2026-11-04", source: "api", stale: false });
    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });

  it("reuses the stored rate of today without calling the API", async () => {
    await getCurrentRate({ database, fetchFunction: apiReturning(1588.6), now });
    const fetchFunction = apiReturning(2000);
    const current = await getCurrentRate({ database, fetchFunction, now });
    expect(current.rate).toBe(1588.6);
    expect(fetchFunction).not.toHaveBeenCalled();
  });

  it("keeps a manual rate of today over the API", async () => {
    setManualRate({ database, now }, 1700);
    const fetchFunction = apiReturning(1588.6);
    const current = await getCurrentRate({ database, fetchFunction, now });
    expect(current).toEqual({ rate: 1700, date: "2026-11-04", source: "manual", stale: false });
    expect(fetchFunction).not.toHaveBeenCalled();
  });

  it("falls back to the latest stored rate flagged as stale when the API fails", async () => {
    saveRate(database, { date: "2026-11-01", rate: exchangeRate(1500), source: "api" });
    saveRate(database, { date: "2026-11-02", rate: exchangeRate(1520), source: "api" });
    const current = await getCurrentRate({ database, fetchFunction: apiFailing(), now });
    expect(current).toEqual({ rate: 1520, date: "2026-11-02", source: "api", stale: true });
  });

  it("throws when the API fails and nothing is stored", async () => {
    await expect(getCurrentRate({ database, fetchFunction: apiFailing(), now })).rejects.toBeInstanceOf(
      NoExchangeRateAvailableError,
    );
  });
});

describe("setManualRate", () => {
  it("overrides an API rate of the same day", async () => {
    await getCurrentRate({ database, fetchFunction: apiReturning(1588.6), now });
    const manual = setManualRate({ database, now }, 1650);
    expect(manual).toEqual({ rate: 1650, date: "2026-11-04", source: "manual", stale: false });
    const current = await getCurrentRate({ database, fetchFunction: apiFailing(), now });
    expect(current.rate).toBe(1650);
  });

  it("rejects invalid values", () => {
    expect(() => setManualRate({ database, now }, 0)).toThrow(RangeError);
  });
});
