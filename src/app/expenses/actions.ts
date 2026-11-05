"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createExpense, deleteExpense, updateExpense } from "../../db/expenses.ts";
import { getDatabase } from "../../db/instance.ts";
import type { ActionState } from "../../components/action-state.ts";
import { monthOfDate } from "../../lib/dates.ts";
import { expenseFormSchema, expenseUpdateFormSchema, idFormSchema } from "../../lib/form-schemas.ts";
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

type UpdateOutcome = { targetMonth: string | null; viewMonth: string | null };

const updateExpenseAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const outcome: UpdateOutcome = { targetMonth: null, viewMonth: null };
  const result = await runAction(
    expenseUpdateFormSchema,
    formData,
    "Gasto actualizado",
    EXPENSE_PATHS,
    (input) => {
      updateExpense(getDatabase(), input.id, {
        date: input.date,
        description: input.description,
        amount: money(input.amount, input.currency),
        categoryId: input.categoryId,
      });
      outcome.targetMonth = monthOfDate(input.date);
      outcome.viewMonth = input.viewMonth;
    },
  );
  if (result.status === "success" && outcome.targetMonth !== null && outcome.targetMonth !== outcome.viewMonth) {
    redirect(`/expenses?month=${outcome.targetMonth}`);
  }
  return result;
};

const deleteExpenseAction = async (formData: FormData): Promise<void> => {
  const parsed = idFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    deleteExpense(getDatabase(), parsed.data.id);
    EXPENSE_PATHS.forEach((path) => revalidatePath(path));
  }
};

export { createExpenseAction, deleteExpenseAction, updateExpenseAction };
