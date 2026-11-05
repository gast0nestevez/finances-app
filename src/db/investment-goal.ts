import { desc, lte } from "drizzle-orm";
import { money } from "../lib/money.ts";
import type { Money } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { investmentGoals } from "./schema.ts";

type MonthlyInvestmentGoal = Readonly<{
  month: string;
  goal: Money;
  inherited: boolean;
}>;

const findInvestmentGoalForMonth = (
  database: AppDatabase,
  month: string,
): MonthlyInvestmentGoal | null => {
  const row = database
    .select()
    .from(investmentGoals)
    .where(lte(investmentGoals.month, month))
    .orderBy(desc(investmentGoals.month))
    .limit(1)
    .get();
  if (row === undefined) {
    return null;
  }
  return {
    month: row.month,
    goal: money(row.amountCents, row.currency),
    inherited: row.month !== month,
  };
};

const saveInvestmentGoal = (database: AppDatabase, month: string, goal: Money): void => {
  database
    .insert(investmentGoals)
    .values({ month, amountCents: goal.amount, currency: goal.currency })
    .onConflictDoUpdate({
      target: investmentGoals.month,
      set: { amountCents: goal.amount, currency: goal.currency },
    })
    .run();
};

export { findInvestmentGoalForMonth, saveInvestmentGoal };
export type { MonthlyInvestmentGoal };
