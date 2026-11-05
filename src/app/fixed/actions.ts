"use server";

import { revalidatePath } from "next/cache";
import {
  createFixedExpense,
  deleteFixedExpense,
  setFixedExpenseActive,
  updateFixedExpense,
} from "../../db/fixed-expenses.ts";
import { getDatabase } from "../../db/instance.ts";
import { toIsoMonth } from "../../lib/dates.ts";
import type { ActionState } from "../../components/action-state.ts";
import {
  fixedExpenseActiveFormSchema,
  fixedExpenseFormSchema,
  fixedExpenseUpdateFormSchema,
  idFormSchema,
} from "../../lib/form-schemas.ts";
import { money } from "../../lib/money.ts";
import { runAction } from "../run-action.ts";

const FIXED_PATHS = ["/fixed", "/"] as const;

const refresh = (): void => {
  FIXED_PATHS.forEach((path) => revalidatePath(path));
};

const createFixedExpenseAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(fixedExpenseFormSchema, formData, "Gasto fijo agregado", FIXED_PATHS, (input) => {
    createFixedExpense(
      getDatabase(),
      { name: input.name, amount: money(input.amount, input.currency) },
      toIsoMonth(new Date()),
    );
  });

const updateFixedExpenseAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(fixedExpenseUpdateFormSchema, formData, "Gasto fijo actualizado", FIXED_PATHS, (input) => {
    updateFixedExpense(
      getDatabase(),
      input.id,
      { name: input.name, amount: money(input.amount, input.currency) },
      toIsoMonth(new Date()),
    );
  });

const setFixedExpenseActiveAction = async (formData: FormData): Promise<void> => {
  const parsed = fixedExpenseActiveFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    setFixedExpenseActive(getDatabase(), parsed.data.id, parsed.data.active, toIsoMonth(new Date()));
    refresh();
  }
};

const deleteFixedExpenseAction = async (formData: FormData): Promise<void> => {
  const parsed = idFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    deleteFixedExpense(getDatabase(), parsed.data.id);
    refresh();
  }
};

export {
  createFixedExpenseAction,
  deleteFixedExpenseAction,
  setFixedExpenseActiveAction,
  updateFixedExpenseAction,
};
