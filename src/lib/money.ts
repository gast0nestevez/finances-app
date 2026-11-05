import { z } from "zod";

const currencySchema = z.enum(["ARS", "USD"]);
type Currency = z.infer<typeof currencySchema>;

type Cents = number & { readonly __brand: "Cents" };
type ExchangeRate = number & { readonly __brand: "ExchangeRate" };

type Money = Readonly<{
  amount: Cents;
  currency: Currency;
}>;

const cents = (value: number): Cents => {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, received ${value}`);
  }
  return value as Cents;
};

const exchangeRate = (value: number): ExchangeRate => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Exchange rate must be a positive number, received ${value}`);
  }
  return value as ExchangeRate;
};

const money = (amount: number, currency: Currency): Money => ({
  amount: cents(amount),
  currency,
});

const convert = (value: Money, target: Currency, rate: ExchangeRate): Money => {
  if (value.currency === target) {
    return value;
  }
  const converted = target === "USD" ? value.amount / rate : value.amount * rate;
  return { amount: cents(Math.round(converted)), currency: target };
};

const sum = (values: readonly Money[], target: Currency, rate: ExchangeRate): Money => {
  const total = values.reduce<number>(
    (accumulated, value) => accumulated + convert(value, target, rate).amount,
    0,
  );
  return { amount: cents(total), currency: target };
};

const parseAmountToCents = (input: string): Cents => {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new RangeError(`Invalid amount: ${input}`);
  }
  return cents(Math.round(Number(normalized) * 100));
};

const formatCentsForInput = (value: Cents): string => {
  const whole = Math.floor(value / 100);
  const fraction = value % 100;
  return fraction === 0 ? String(whole) : `${whole},${String(fraction).padStart(2, "0")}`;
};

const formatMoney = (value: Money): string => {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: value.currency,
    currencyDisplay: value.currency === "USD" ? "code" : "symbol",
  });
  return formatter.format(value.amount / 100);
};

export {
  cents,
  convert,
  currencySchema,
  exchangeRate,
  formatCentsForInput,
  formatMoney,
  money,
  parseAmountToCents,
  sum,
};
export type { Cents, Currency, ExchangeRate, Money };
