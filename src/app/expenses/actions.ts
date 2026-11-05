"use server";

import { revalidatePath } from "next/cache";
import { createExpense, deleteExpense } from "../../db/expenses.ts";
import { getDatabase } from "../../db/instance.ts";
import type { ActionState } from "../../components/action-state.ts";
import { expenseFormSchema, idFormSchema } from "../../lib/form-schemas.ts";
import { money } from "../../lib/money.ts";
import { getCurrentRate } from "../../services/exchange-rate-service.ts";
import { runAction } from "../run-action.ts";

const EXPENSE_PATHS = ["/expenses", "/"] as const;

const createExpenseAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(expenseFormSchema, formData, "Gasto registrado", EXPENSE_PATHS, async (input) => {
    const database = getDatabase();
    const current = await getCurrentRate({ database });
    createExpense(database, {
      date: input.date,
      description: input.description,
      amount: money(input.amount, input.currency),
      categoryId: input.categoryId,
      rateAtRegistration: current.rate,
    });
  });

const deleteExpenseAction = async (formData: FormData): Promise<void> => {
  const parsed = idFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    deleteExpense(getDatabase(), parsed.data.id);
    EXPENSE_PATHS.forEach((path) => revalidatePath(path));
  }
};

export { createExpenseAction, deleteExpenseAction };
