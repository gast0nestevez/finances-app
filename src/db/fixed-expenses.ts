import { and, desc, eq, lte } from "drizzle-orm";
import { money } from "../lib/money.ts";
import type { Money } from "../lib/money.ts";
import type { AppDatabase } from "./client.ts";
import { fixedExpenses, fixedExpenseVersions } from "./schema.ts";

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

type VersionRow = typeof fixedExpenseVersions.$inferSelect;

const toFixedExpense = (row: VersionRow): FixedExpense => ({
  id: row.fixedExpenseId,
  name: row.name,
  amount: money(row.amountCents, row.currency),
  active: row.active,
});

const findVersionAtMonth = (database: AppDatabase, id: number, month: string): VersionRow | undefined =>
  database
    .select()
    .from(fixedExpenseVersions)
    .where(and(eq(fixedExpenseVersions.fixedExpenseId, id), lte(fixedExpenseVersions.fromMonth, month)))
    .orderBy(desc(fixedExpenseVersions.fromMonth))
    .limit(1)
    .get();

const requireVersionAtMonth = (database: AppDatabase, id: number, month: string): VersionRow => {
  const version = findVersionAtMonth(database, id, month);
  if (version === undefined) {
    throw new Error(`Fixed expense ${id} does not exist in ${month}`);
  }
  return version;
};

const listFixedExpensesForMonth = (database: AppDatabase, month: string): readonly FixedExpense[] => {
  const rows = database
    .select()
    .from(fixedExpenseVersions)
    .where(lte(fixedExpenseVersions.fromMonth, month))
    .orderBy(desc(fixedExpenseVersions.fromMonth))
    .all();
  const latestById = new Map<number, VersionRow>();
  rows.forEach((row) => {
    if (!latestById.has(row.fixedExpenseId)) {
      latestById.set(row.fixedExpenseId, row);
    }
  });
  return [...latestById.values()]
    .map(toFixedExpense)
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
};

const listActiveFixedExpensesForMonth = (
  database: AppDatabase,
  month: string,
): readonly FixedExpense[] =>
  listFixedExpensesForMonth(database, month).filter((expense) => expense.active);

type VersionWriter = Pick<AppDatabase, "insert">;

const saveVersion = (database: VersionWriter, id: number, month: string, values: Omit<FixedExpense, "id">): void => {
  database
    .insert(fixedExpenseVersions)
    .values({
      fixedExpenseId: id,
      fromMonth: month,
      name: values.name,
      amountCents: values.amount.amount,
      currency: values.amount.currency,
      active: values.active,
    })
    .onConflictDoUpdate({
      target: [fixedExpenseVersions.fixedExpenseId, fixedExpenseVersions.fromMonth],
      set: {
        name: values.name,
        amountCents: values.amount.amount,
        currency: values.amount.currency,
        active: values.active,
      },
    })
    .run();
};

const createFixedExpense = (
  database: AppDatabase,
  input: NewFixedExpense,
  fromMonth: string,
): FixedExpense =>
  database.transaction((transaction) => {
    const created = transaction.insert(fixedExpenses).values({}).returning().get();
    const expense: FixedExpense = { id: created.id, name: input.name, amount: input.amount, active: true };
    saveVersion(transaction, created.id, fromMonth, expense);
    return expense;
  });

const updateFixedExpense = (
  database: AppDatabase,
  id: number,
  input: NewFixedExpense,
  fromMonth: string,
): void => {
  const current = requireVersionAtMonth(database, id, fromMonth);
  saveVersion(database, id, fromMonth, { name: input.name, amount: input.amount, active: current.active });
};

const setFixedExpenseActive = (
  database: AppDatabase,
  id: number,
  active: boolean,
  fromMonth: string,
): void => {
  const current = toFixedExpense(requireVersionAtMonth(database, id, fromMonth));
  saveVersion(database, id, fromMonth, { name: current.name, amount: current.amount, active });
};

const deleteFixedExpense = (database: AppDatabase, id: number): void => {
  database.delete(fixedExpenses).where(eq(fixedExpenses.id, id)).run();
};

export {
  createFixedExpense,
  deleteFixedExpense,
  listActiveFixedExpensesForMonth,
  listFixedExpensesForMonth,
  setFixedExpenseActive,
  updateFixedExpense,
};
export type { FixedExpense, NewFixedExpense };
