import { money } from "../lib/money.ts";
import type { Money } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { investmentGoal } from "./schema.ts";

const GOAL_ROW_ID = 1;

const findInvestmentGoal = (database: AppDatabase): Money | null => {
  const row = database.select().from(investmentGoal).get();
  return row === undefined ? null : money(row.amountCents, row.currency);
};

const saveInvestmentGoal = (database: AppDatabase, goal: Money): void => {
  database
    .insert(investmentGoal)
    .values({ id: GOAL_ROW_ID, amountCents: goal.amount, currency: goal.currency })
    .onConflictDoUpdate({
      target: investmentGoal.id,
      set: { amountCents: goal.amount, currency: goal.currency },
    })
    .run();
};

export { findInvestmentGoal, saveInvestmentGoal };
