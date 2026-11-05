import { convert, money, sum } from "./money.ts";
import type { Currency, ExchangeRate, Money } from "./money.ts";

type VariableExpense = Readonly<{
  amount: Money;
  rateAtRegistration: ExchangeRate;
}>;

type MonthInput = Readonly<{
  salary: Money;
  fixedExpenses: readonly Money[];
  investmentGoal: Money;
  variableExpenses: readonly VariableExpense[];
}>;

type MonthSummary = Readonly<{
  currency: Currency;
  salary: Money;
  fixed: Money;
  investment: Money;
  variable: Money;
  free: Money;
}>;

const summarizeMonth = (
  input: MonthInput,
  displayCurrency: Currency,
  currentRate: ExchangeRate,
): MonthSummary => {
  const salary = convert(input.salary, displayCurrency, currentRate);
  const fixed = sum(input.fixedExpenses, displayCurrency, currentRate);
  const investment = convert(input.investmentGoal, displayCurrency, currentRate);
  const variableTotal = input.variableExpenses.reduce<number>(
    (accumulated, expense) =>
      accumulated + convert(expense.amount, displayCurrency, expense.rateAtRegistration).amount,
    0,
  );
  const variable = money(variableTotal, displayCurrency);
  const free = money(
    salary.amount - fixed.amount - investment.amount - variable.amount,
    displayCurrency,
  );
  return { currency: displayCurrency, salary, fixed, investment, variable, free };
};

export { summarizeMonth };
export type { MonthInput, MonthSummary, VariableExpense };
