import { isIsoMonth } from "../lib/dates.ts";
import { currencySchema } from "../lib/money.ts";
import type { Currency } from "../lib/money.ts";

type SearchParamValue = string | string[] | undefined;

const resolveMonth = (value: SearchParamValue, fallback: string): string =>
  typeof value === "string" && isIsoMonth(value) ? value : fallback;

const resolveCurrency = (value: SearchParamValue, fallback: Currency): Currency => {
  const parsed = currencySchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
};

export { resolveCurrency, resolveMonth };
export type { SearchParamValue };
