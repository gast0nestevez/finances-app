import { findLatestRate, findRateByDate, saveRate } from "../db/exchange-rates.ts";
import type { RateSource } from "../db/exchange-rates.ts";
import type { AppDatabase } from "../db/client.ts";
import { toIsoDate } from "../lib/dates.ts";
import { exchangeRate } from "../lib/money.ts";
import type { ExchangeRate } from "../lib/money.ts";
import { fetchMepRate } from "./dolarapi.ts";
import type { FetchFunction } from "./dolarapi.ts";

type CurrentRate = Readonly<{
  rate: ExchangeRate;
  date: string;
  source: RateSource;
  stale: boolean;
}>;

type ExchangeRateDependencies = Readonly<{
  database: AppDatabase;
  fetchFunction?: FetchFunction;
  now?: () => Date;
}>;

class NoExchangeRateAvailableError extends Error {
  constructor() {
    super("No exchange rate is stored and the remote service is unreachable");
    this.name = "NoExchangeRateAvailableError";
  }
}

const getCurrentRate = async (dependencies: ExchangeRateDependencies): Promise<CurrentRate> => {
  const { database, fetchFunction, now = () => new Date() } = dependencies;
  const today = toIsoDate(now());

  const stored = findRateByDate(database, today);
  if (stored !== null) {
    return { ...stored, stale: false };
  }

  try {
    const rate = await fetchMepRate(fetchFunction);
    saveRate(database, { date: today, rate, source: "api" });
    return { rate, date: today, source: "api", stale: false };
  } catch {
    const latest = findLatestRate(database);
    if (latest === null) {
      throw new NoExchangeRateAvailableError();
    }
    return { ...latest, stale: true };
  }
};

const setManualRate = (
  dependencies: Pick<ExchangeRateDependencies, "database" | "now">,
  value: number,
): CurrentRate => {
  const { database, now = () => new Date() } = dependencies;
  const today = toIsoDate(now());
  const rate = exchangeRate(value);
  saveRate(database, { date: today, rate, source: "manual" });
  return { rate, date: today, source: "manual", stale: false };
};

export { getCurrentRate, NoExchangeRateAvailableError, setManualRate };
export type { CurrentRate, ExchangeRateDependencies };
