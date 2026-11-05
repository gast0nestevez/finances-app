import { describe, expect, it } from "vitest";
import { buildBreakdown } from "./month-breakdown.ts";
import { money } from "./money.ts";
import type { MonthSummary } from "./month-summary.ts";

const summaryOf = (salary: number, fixed: number, investment: number, variable: number): MonthSummary => ({
  currency: "ARS",
  salary: money(salary, "ARS"),
  fixed: money(fixed, "ARS"),
  investment: money(investment, "ARS"),
  variable: money(variable, "ARS"),
  free: money(salary - fixed - investment - variable, "ARS"),
});

describe("buildBreakdown", () => {
  it("splits the salary into percentages that add up to 100", () => {
    const breakdown = buildBreakdown(summaryOf(1000, 400, 200, 100));
    expect(breakdown).toEqual({ fixed: 40, investment: 20, variable: 10, free: 30, overspent: false });
  });

  it("scales segments when committed money exceeds the salary", () => {
    const breakdown = buildBreakdown(summaryOf(1000, 800, 400, 200));
    expect(breakdown.overspent).toBe(true);
    expect(breakdown.free).toBe(0);
    expect(breakdown.fixed + breakdown.investment + breakdown.variable).toBeCloseTo(100);
  });

  it("returns an empty breakdown without salary", () => {
    expect(buildBreakdown(summaryOf(0, 0, 0, 0))).toEqual({
      fixed: 0,
      investment: 0,
      variable: 0,
      free: 0,
      overspent: false,
    });
  });

  it("flags overspending even when there is no salary", () => {
    expect(buildBreakdown(summaryOf(0, 100, 0, 0)).overspent).toBe(true);
  });

  it("treats spending equal to the salary as not overspent", () => {
    const breakdown = buildBreakdown(summaryOf(1000, 600, 300, 100));
    expect(breakdown.overspent).toBe(false);
    expect(breakdown.free).toBe(0);
  });
});
