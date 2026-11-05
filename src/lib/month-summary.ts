import { convert, money, sum, type Currency, type ExchangeRate, type Money } from "./money";

export type VariableExpense = Readonly<{
  amount: Money;
  rateAtRegistration: ExchangeRate;
}>;

export type MonthInput = Readonly<{
  salary: Money;
  fixedExpenses: readonly Money[];
  investmentGoal: Money;
  variableExpenses: readonly VariableExpense[];
}>;

export type MonthSummary = Readonly<{
  currency: Currency;
  salary: Money;
  fixed: Money;
  investment: Money;
  variable: Money;
  free: Money;
}>;

export function summarizeMonth(
  input: MonthInput,
  displayCurrency: Currency,
  currentRate: ExchangeRate,
): MonthSummary {
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
}
