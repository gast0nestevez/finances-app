import { desc, eq } from "drizzle-orm";
import { exchangeRate } from "../lib/money.ts";
import type { ExchangeRate } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { exchangeRates } from "./schema.ts";

type RateSource = "api" | "manual";

type StoredRate = Readonly<{
  date: string;
  rate: ExchangeRate;
  source: RateSource;
}>;

const findRateByDate = (database: AppDatabase, date: string): StoredRate | null => {
  const row = database.select().from(exchangeRates).where(eq(exchangeRates.date, date)).get();
  return row === undefined ? null : { date: row.date, rate: exchangeRate(row.rate), source: row.source };
};

const findLatestRate = (database: AppDatabase): StoredRate | null => {
  const row = database.select().from(exchangeRates).orderBy(desc(exchangeRates.date)).limit(1).get();
  return row === undefined ? null : { date: row.date, rate: exchangeRate(row.rate), source: row.source };
};

const saveRate = (database: AppDatabase, stored: StoredRate): void => {
  database
    .insert(exchangeRates)
    .values({ date: stored.date, rate: stored.rate, source: stored.source })
    .onConflictDoUpdate({
      target: exchangeRates.date,
      set: { rate: stored.rate, source: stored.source },
    })
    .run();
};

export { findLatestRate, findRateByDate, saveRate };
export type { RateSource, StoredRate };
