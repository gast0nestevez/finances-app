import { z } from "zod";
import { parseDisplayDate } from "./dates.ts";
import { currencySchema, exchangeRate, parseAmountToCents } from "./money.ts";

const INVALID_AMOUNT_MESSAGE = "Ingresá un monto válido, por ejemplo 1.500,50";

const amountSchema = z.string().transform((value, context) => {
  try {
    return parseAmountToCents(value);
  } catch {
    context.addIssue({ code: "custom", message: INVALID_AMOUNT_MESSAGE });
    return z.NEVER;
  }
});

const positiveAmountSchema = amountSchema.refine((value) => value > 0, {
  message: "El monto debe ser mayor a cero",
});

const rateSchema = z.string().transform((value, context) => {
  try {
    return exchangeRate(parseAmountToCents(value) / 100);
  } catch {
    context.addIssue({ code: "custom", message: "Ingresá una cotización válida, por ejemplo 1.588,60" });
    return z.NEVER;
  }
});

const nameSchema = z
  .string()
  .trim()
  .min(1, "El nombre no puede estar vacío")
  .max(60, "El nombre es demasiado largo");

const idSchema = z.coerce.number().int().positive();

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "La descripción no puede estar vacía")
  .max(120, "La descripción es demasiado larga");

const optionalCategorySchema = z.string().transform((value, context) => {
  if (value === "") {
    return null;
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    context.addIssue({ code: "custom", message: "Categoría inválida" });
    return z.NEVER;
  }
  return id;
});

const dateSchema = z.string().transform((value, context) => {
  const isoDate = parseDisplayDate(value);
  if (isoDate === null) {
    context.addIssue({ code: "custom", message: "Ingresá una fecha válida con formato dd/mm/aaaa" });
    return z.NEVER;
  }
  return isoDate;
});

const booleanFlagSchema = z.enum(["true", "false"]).transform((value) => value === "true");

const incomeFormSchema = z.object({ amount: amountSchema });
const investmentGoalFormSchema = z.object({ amount: amountSchema, currency: currencySchema });
const rateFormSchema = z.object({ rate: rateSchema });
const categoryFormSchema = z.object({ name: nameSchema });
const categoryUpdateFormSchema = z.object({ id: idSchema, name: nameSchema });
const idFormSchema = z.object({ id: idSchema });
const fixedExpenseFormSchema = z.object({
  name: nameSchema,
  amount: positiveAmountSchema,
  currency: currencySchema,
});
const fixedExpenseUpdateFormSchema = fixedExpenseFormSchema.extend({ id: idSchema });
const fixedExpenseActiveFormSchema = z.object({ id: idSchema, active: booleanFlagSchema });
const expenseFormSchema = z.object({
  date: dateSchema,
  description: descriptionSchema,
  amount: positiveAmountSchema,
  currency: currencySchema,
  categoryId: optionalCategorySchema,
});

export {
  categoryFormSchema,
  categoryUpdateFormSchema,
  expenseFormSchema,
  fixedExpenseActiveFormSchema,
  fixedExpenseFormSchema,
  fixedExpenseUpdateFormSchema,
  idFormSchema,
  incomeFormSchema,
  investmentGoalFormSchema,
  rateFormSchema,
};
