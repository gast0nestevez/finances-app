import { desc, lte } from "drizzle-orm";
import { cents, money } from "../lib/money.ts";
import type { Cents, Money } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { income } from "./schema.ts";

type MonthlyIncome = Readonly<{
  month: string;
  amount: Money;
  inherited: boolean;
}>;

const findIncomeForMonth = (database: AppDatabase, month: string): MonthlyIncome | null => {
  const row = database
    .select()
    .from(income)
    .where(lte(income.month, month))
    .orderBy(desc(income.month))
    .limit(1)
    .get();
  if (row === undefined) {
    return null;
  }
  return { month: row.month, amount: money(row.amountCents, "ARS"), inherited: row.month !== month };
};

const saveIncome = (database: AppDatabase, month: string, amount: Cents): void => {
  database
    .insert(income)
    .values({ month, amountCents: cents(amount) })
    .onConflictDoUpdate({ target: income.month, set: { amountCents: amount } })
    .run();
};

export { findIncomeForMonth, saveIncome };
export type { MonthlyIncome };
