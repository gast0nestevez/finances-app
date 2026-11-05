import { and, desc, eq, gte, lt } from "drizzle-orm";
import { shiftMonth } from "../lib/dates.ts";
import { exchangeRate, money } from "../lib/money.ts";
import type { ExchangeRate, Money } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { categories, expenses } from "./schema.ts";

type Expense = Readonly<{
  id: number;
  date: string;
  description: string;
  amount: Money;
  categoryId: number | null;
  categoryName: string | null;
  rateAtRegistration: ExchangeRate;
}>;

type NewExpense = Readonly<{
  date: string;
  description: string;
  amount: Money;
  categoryId: number | null;
  rateAtRegistration: ExchangeRate;
}>;

const listExpensesByMonth = (database: AppDatabase, month: string): readonly Expense[] =>
  database
    .select({
      id: expenses.id,
      date: expenses.date,
      description: expenses.description,
      amountCents: expenses.amountCents,
      currency: expenses.currency,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      rate: expenses.rateAtRegistration,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(gte(expenses.date, `${month}-01`), lt(expenses.date, `${shiftMonth(month, 1)}-01`)))
    .orderBy(desc(expenses.date), desc(expenses.id))
    .all()
    .map((row) => ({
      id: row.id,
      date: row.date,
      description: row.description,
      amount: money(row.amountCents, row.currency),
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      rateAtRegistration: exchangeRate(row.rate),
    }));

const createExpense = (database: AppDatabase, input: NewExpense): void => {
  database
    .insert(expenses)
    .values({
      date: input.date,
      description: input.description,
      amountCents: input.amount.amount,
      currency: input.amount.currency,
      categoryId: input.categoryId,
      rateAtRegistration: input.rateAtRegistration,
    })
    .run();
};

const deleteExpense = (database: AppDatabase, id: number): void => {
  database.delete(expenses).where(eq(expenses.id, id)).run();
};

export { createExpense, deleteExpense, listExpensesByMonth };
export type { Expense, NewExpense };
