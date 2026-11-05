import { convert, money } from "./money.ts";
import type { Currency, ExchangeRate, Money } from "./money.ts";

type CategorizedExpense = Readonly<{
  categoryId: number | null;
  categoryName: string | null;
  amount: Money;
  rateAtRegistration: ExchangeRate;
}>;

type CategoryShare = Readonly<{
  key: string;
  label: string;
  amount: Money;
  share: number;
  count: number;
  isOther: boolean;
}>;

type CategoryBreakdown = Readonly<{
  total: Money;
  rows: readonly CategoryShare[];
}>;

const UNCATEGORIZED_LABEL = "Sin categoría";
const OTHER_LABEL = "Otras";
const MAX_VISIBLE_ROWS = 8;
const VISIBLE_ROWS_WHEN_FOLDING = 7;

type Accumulator = { key: string; label: string; cents: number; count: number };

const compareRows = (left: Accumulator, right: Accumulator): number =>
  right.cents - left.cents || left.label.localeCompare(right.label, "es");

const buildCategoryBreakdown = (
  expenses: readonly CategorizedExpense[],
  currency: Currency,
): CategoryBreakdown => {
  const groups = new Map<string, Accumulator>();
  expenses.forEach((expense) => {
    const key = expense.categoryId === null ? "none" : `category-${expense.categoryId}`;
    const label = expense.categoryName ?? UNCATEGORIZED_LABEL;
    const cents = convert(expense.amount, currency, expense.rateAtRegistration).amount;
    const group = groups.get(key) ?? { key, label, cents: 0, count: 0 };
    group.cents += cents;
    group.count += 1;
    groups.set(key, group);
  });

  const sorted = [...groups.values()].sort(compareRows);
  const totalCents = sorted.reduce((accumulated, group) => accumulated + group.cents, 0);
  const shareOf = (cents: number): number => (totalCents === 0 ? 0 : cents / totalCents);

  const visible = sorted.length > MAX_VISIBLE_ROWS ? sorted.slice(0, VISIBLE_ROWS_WHEN_FOLDING) : sorted;
  const folded = sorted.slice(visible.length);

  const rows: CategoryShare[] = visible.map((group) => ({
    key: group.key,
    label: group.label,
    amount: money(group.cents, currency),
    share: shareOf(group.cents),
    count: group.count,
    isOther: false,
  }));

  if (folded.length > 0) {
    const foldedCents = folded.reduce((accumulated, group) => accumulated + group.cents, 0);
    rows.push({
      key: "other",
      label: `${OTHER_LABEL} (${folded.length})`,
      amount: money(foldedCents, currency),
      share: shareOf(foldedCents),
      count: folded.reduce((accumulated, group) => accumulated + group.count, 0),
      isOther: true,
    });
  }

  return { total: money(totalCents, currency), rows };
};

const formatShare = (share: number): string => {
  if (share <= 0) {
    return "0%";
  }
  return share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`;
};

export { buildCategoryBreakdown, formatShare };
export type { CategorizedExpense, CategoryBreakdown, CategoryShare };
