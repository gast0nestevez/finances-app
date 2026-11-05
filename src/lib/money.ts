import { z } from "zod";

export const currencySchema = z.enum(["ARS", "USD"]);
export type Currency = z.infer<typeof currencySchema>;

export type Cents = number & { readonly __brand: "Cents" };
export type ExchangeRate = number & { readonly __brand: "ExchangeRate" };

export type Money = Readonly<{
  amount: Cents;
  currency: Currency;
}>;

export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, received ${value}`);
  }
  return value as Cents;
}

export function exchangeRate(value: number): ExchangeRate {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Exchange rate must be a positive number, received ${value}`);
  }
  return value as ExchangeRate;
}

export function money(amount: number, currency: Currency): Money {
  return { amount: cents(amount), currency };
}

export function convert(value: Money, target: Currency, rate: ExchangeRate): Money {
  if (value.currency === target) {
    return value;
  }
  const converted = target === "USD" ? value.amount / rate : value.amount * rate;
  return { amount: cents(Math.round(converted)), currency: target };
}

export function sum(values: readonly Money[], target: Currency, rate: ExchangeRate): Money {
  const total = values.reduce<number>(
    (accumulated, value) => accumulated + convert(value, target, rate).amount,
    0,
  );
  return { amount: cents(total), currency: target };
}

export function parseAmountToCents(input: string): Cents {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new RangeError(`Invalid amount: ${input}`);
  }
  return cents(Math.round(Number(normalized) * 100));
}

export function formatMoney(value: Money): string {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: value.currency,
    currencyDisplay: value.currency === "USD" ? "code" : "symbol",
  });
  return formatter.format(value.amount / 100);
}
