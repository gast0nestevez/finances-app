import { z } from "zod";
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

const incomeFormSchema = z.object({ amount: amountSchema });
const investmentGoalFormSchema = z.object({ amount: amountSchema, currency: currencySchema });
const rateFormSchema = z.object({ rate: rateSchema });
const categoryFormSchema = z.object({ name: nameSchema });
const categoryUpdateFormSchema = z.object({ id: idSchema, name: nameSchema });
const idFormSchema = z.object({ id: idSchema });

export {
  categoryFormSchema,
  categoryUpdateFormSchema,
  idFormSchema,
  incomeFormSchema,
  investmentGoalFormSchema,
  rateFormSchema,
};
