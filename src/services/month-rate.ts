import { findRateForMonth } from "../db/exchange-rates.ts";
import type { RateSource } from "../db/exchange-rates.ts";
import type { AppDatabase } from "../db/client.ts";
import type { ExchangeRate } from "../lib/money.ts";
import type { CurrentRate } from "./exchange-rate-service.ts";

type MonthRate = Readonly<{
  rate: ExchangeRate;
  date: string;
  source: RateSource;
  stale: boolean;
  historical: boolean;
}>;

type MonthRateInput = Readonly<{
  database: AppDatabase;
  month: string;
  currentMonth: string;
  current: CurrentRate | null;
}>;

const resolveMonthRate = (input: MonthRateInput): MonthRate | null => {
  const { database, month, currentMonth, current } = input;
  if (month < currentMonth) {
    const stored = findRateForMonth(database, month);
    if (stored !== null) {
      return { ...stored, stale: false, historical: true };
    }
  }
  return current === null ? null : { ...current, historical: false };
};

export { resolveMonthRate };
export type { MonthRate };
