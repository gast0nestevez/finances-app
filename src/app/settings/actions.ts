"use server";

import { addCategory, deleteCategory, renameCategory } from "../../db/categories.ts";
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
import type { ActionState } from "../../components/action-state.ts";
import { runAction } from "../run-action.ts";
import { revalidatePath } from "next/cache";

const SETTINGS_PATHS = ["/settings", "/"] as const;

const saveIncomeAction = async (_previous: ActionState, formData: FormData): Promise<ActionState> =>
  runAction(incomeFormSchema, formData, "Sueldo guardado", SETTINGS_PATHS, (input) =>
    saveIncome(getDatabase(), toIsoMonth(new Date()), input.amount),
  );

const saveInvestmentGoalAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(investmentGoalFormSchema, formData, "Objetivo guardado", SETTINGS_PATHS, (input) =>
    saveInvestmentGoal(getDatabase(), money(input.amount, input.currency)),
  );

const saveManualRateAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(rateFormSchema, formData, "Cotización guardada", SETTINGS_PATHS, (input) => {
    setManualRate({ database: getDatabase() }, input.rate);
  });

const addCategoryAction = async (_previous: ActionState, formData: FormData): Promise<ActionState> =>
  runAction(categoryFormSchema, formData, "Categoría agregada", SETTINGS_PATHS, (input) => {
    addCategory(getDatabase(), input.name);
  });

const renameCategoryAction = async (
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> =>
  runAction(categoryUpdateFormSchema, formData, "Categoría renombrada", SETTINGS_PATHS, (input) =>
    renameCategory(getDatabase(), input.id, input.name),
  );

const deleteCategoryAction = async (formData: FormData): Promise<void> => {
  const parsed = idFormSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    deleteCategory(getDatabase(), parsed.data.id);
    SETTINGS_PATHS.forEach((path) => revalidatePath(path));
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
