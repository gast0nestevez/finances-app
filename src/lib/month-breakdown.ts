import type { MonthSummary } from "./month-summary.ts";

type MonthBreakdown = Readonly<{
  fixed: number;
  investment: number;
  variable: number;
  free: number;
  overspent: boolean;
}>;

const emptyBreakdown: MonthBreakdown = {
  fixed: 0,
  investment: 0,
  variable: 0,
  free: 0,
  overspent: false,
};

const buildBreakdown = (summary: MonthSummary): MonthBreakdown => {
  const salary = summary.salary.amount;
  if (salary <= 0) {
    return { ...emptyBreakdown, overspent: summary.free.amount < 0 };
  }
  const committed = summary.fixed.amount + summary.investment.amount + summary.variable.amount;
  const overspent = committed > salary;
  const base = overspent ? committed : salary;
  return {
    fixed: (summary.fixed.amount / base) * 100,
    investment: (summary.investment.amount / base) * 100,
    variable: (summary.variable.amount / base) * 100,
    free: overspent ? 0 : ((salary - committed) / base) * 100,
    overspent,
  };
};

export { buildBreakdown };
export type { MonthBreakdown };
