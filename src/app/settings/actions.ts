"use server";

import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { addCategory, deleteCategory, DuplicateCategoryError, renameCategory } from "../../db/categories.ts";
import { getDatabase } from "../../db/instance.ts";
import { saveIncome } from "../../db/income.ts";
import { saveInvestmentGoal } from "../../db/investment-goal.ts";
import {
  categoryFormSchema,
  categoryUpdateFormSchema,
  idFormSchema,
  incomeFormSchema,
  investmentGoalFormSchema,
  rateFormSchema,
} from "../../lib/form-schemas.ts";
import { toIsoMonth } from "../../lib/dates.ts";
import { money } from "../../lib/money.ts";
import { setManualRate } from "../../services/exchange-rate-service.ts";
import type { ActionState } from "./action-state.ts";

const refreshPages = (): void => {
  revalidatePath("/settings");
  revalidatePath("/");
};

const failure = (message: string): ActionState => ({ status: "error", message });
const success = (message: string): ActionState => ({ status: "success", message });

const runAction = <T>(
  schema: ZodType<T>,
  formData: FormData,
  successMessage: string,
  execute: (input: T) => void,
): ActionState => {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  try {
    execute(parsed.data);
  } catch (error: unknown) {
    if (error instanceof DuplicateCategoryError) {
      return failure("Ya existe una categoría con ese nombre");
    }
    return failure("No se pudo guardar, intentá de nuevo");
  }
  refreshPages();
  return success(successMessage);
};

const saveIncomeAction = async (_previous: ActionState, formData: FormData): Promise<ActionState> =>
  runAction(incomeFormSchema, formData, "Sueldo guardado", (input) =>
    saveIncome(getDatabase(), toIsoMonth(new Date()), input.amount),
  );

const saveInvestmentGoalAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(investmentGoalFormSchema, formData, "Objetivo guardado", (input) =>
    saveInvestmentGoal(getDatabase(), money(input.amount, input.currency)),
  );

const saveManualRateAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(rateFormSchema, formData, "Cotización guardada", (input) => {
    setManualRate({ database: getDatabase() }, input.rate);
  });

const addCategoryAction = async (_previous: ActionState, formData: FormData): Promise<ActionState> =>
  runAction(categoryFormSchema, formData, "Categoría agregada", (input) => {
    addCategory(getDatabase(), input.name);
  });

const renameCategoryAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(categoryUpdateFormSchema, formData, "Categoría renombrada", (input) =>
    renameCategory(getDatabase(), input.id, input.name),
  );

const deleteCategoryAction = async (formData: FormData): Promise<void> => {
  const parsed = idFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    deleteCategory(getDatabase(), parsed.data.id);
    refreshPages();
  }
};

export {
  addCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  saveIncomeAction,
  saveInvestmentGoalAction,
  saveManualRateAction,
};
