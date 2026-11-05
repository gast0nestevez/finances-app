import { describe, expect, it } from "vitest";
import { exchangeRate, money } from "./money";
import { summarizeMonth, type MonthInput } from "./month-summary";

const currentRate = exchangeRate(1000);

const input: MonthInput = {
  salary: money(2_000_000_00, "ARS"),
  fixedExpenses: [money(500_000_00, "ARS"), money(20_00, "USD")],
  investmentGoal: money(500_00, "USD"),
  variableExpenses: [
    { amount: money(100_000_00, "ARS"), rateAtRegistration: exchangeRate(900) },
    { amount: money(10_00, "USD"), rateAtRegistration: exchangeRate(900) },
  ],
};

describe("summarizeMonth", () => {
  it("computes the free amount in ARS", () => {
    const summary = summarizeMonth(input, "ARS", currentRate);
    expect(summary.fixed).toEqual(money(520_000_00, "ARS"));
    expect(summary.investment).toEqual(money(500_000_00, "ARS"));
    expect(summary.variable).toEqual(money(109_000_00, "ARS"));
    expect(summary.free).toEqual(money(871_000_00, "ARS"));
  });

  it("computes the free amount in USD", () => {
    const summary = summarizeMonth(input, "USD", currentRate);
    expect(summary.salary).toEqual(money(2_000_00, "USD"));
    expect(summary.variable).toEqual(money(121_11, "USD"));
    expect(summary.free).toEqual(money(2_000_00 - 520_00 - 500_00 - 121_11, "USD"));
  });

  it("allows a negative free amount", () => {
    const summary = summarizeMonth(
      { ...input, salary: money(100_00, "ARS") },
      "ARS",
      currentRate,
    );
    expect(summary.free.amount).toBeLessThan(0);
  });
});
