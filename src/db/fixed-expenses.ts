import { asc, eq } from "drizzle-orm";
import { money } from "../lib/money.ts";
import type { Money } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { fixedExpenses } from "./schema.ts";

type FixedExpense = Readonly<{
  id: number;
  name: string;
  amount: Money;
  active: boolean;
}>;

type NewFixedExpense = Readonly<{
  name: string;
  amount: Money;
}>;

type FixedExpenseRow = typeof fixedExpenses.$inferSelect;

const toFixedExpense = (row: FixedExpenseRow): FixedExpense => ({
  id: row.id,
  name: row.name,
  amount: money(row.amountCents, row.currency),
  active: row.active,
});

const listFixedExpenses = (database: AppDatabase): readonly FixedExpense[] =>
  database.select().from(fixedExpenses).orderBy(asc(fixedExpenses.name)).all().map(toFixedExpense);

const listActiveFixedExpenses = (database: AppDatabase): readonly FixedExpense[] =>
  listFixedExpenses(database).filter((expense) => expense.active);

const createFixedExpense = (database: AppDatabase, input: NewFixedExpense): FixedExpense =>
  toFixedExpense(
    database
      .insert(fixedExpenses)
      .values({ name: input.name, amountCents: input.amount.amount, currency: input.amount.currency })
      .returning()
      .get(),
  );

const updateFixedExpense = (database: AppDatabase, id: number, input: NewFixedExpense): void => {
  database
    .update(fixedExpenses)
    .set({ name: input.name, amountCents: input.amount.amount, currency: input.amount.currency })
    .where(eq(fixedExpenses.id, id))
    .run();
};

const setFixedExpenseActive = (database: AppDatabase, id: number, active: boolean): void => {
  database.update(fixedExpenses).set({ active }).where(eq(fixedExpenses.id, id)).run();
};

const deleteFixedExpense = (database: AppDatabase, id: number): void => {
  database.delete(fixedExpenses).where(eq(fixedExpenses.id, id)).run();
};

export {
  createFixedExpense,
  deleteFixedExpense,
  listActiveFixedExpenses,
  listFixedExpenses,
  setFixedExpenseActive,
  updateFixedExpense,
};
export type { FixedExpense, NewFixedExpense };
