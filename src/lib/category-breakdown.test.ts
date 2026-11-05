import { describe, expect, it } from "vitest";
import { buildCategoryBreakdown, formatShare } from "./category-breakdown.ts";
import type { CategorizedExpense } from "./category-breakdown.ts";
import { exchangeRate, money } from "./money.ts";

const rate = exchangeRate(1000);

const expense = (
  categoryId: number | null,
  categoryName: string | null,
  amount: number,
  currency: "ARS" | "USD" = "ARS",
  registrationRate = rate,
): CategorizedExpense => ({
  categoryId,
  categoryName,
  amount: money(amount, currency),
  rateAtRegistration: registrationRate,
});

describe("buildCategoryBreakdown", () => {
  it("returns an empty breakdown without expenses", () => {
    expect(buildCategoryBreakdown([], "ARS")).toEqual({ total: money(0, "ARS"), rows: [] });
  });

  it("groups by category, sorts by amount and computes shares", () => {
    const { total, rows } = buildCategoryBreakdown(
      [expense(1, "Comida", 3_000), expense(2, "Ocio", 1_000), expense(1, "Comida", 4_000)],
      "ARS",
    );
    expect(total).toEqual(money(8_000, "ARS"));
    expect(rows.map((row) => [row.label, row.amount.amount, row.share, row.count])).toEqual([
      ["Comida", 7_000, 0.875, 2],
      ["Ocio", 1_000, 0.125, 1],
    ]);
  });

  it("groups expenses without category under a single row", () => {
    const { rows } = buildCategoryBreakdown([expense(null, null, 100), expense(null, null, 50)], "ARS");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ label: "Sin categoría", count: 2, key: "none" });
  });

  it("converts mixed currencies with the rate of each expense", () => {
    const { rows, total } = buildCategoryBreakdown(
      [
        expense(1, "Software", 20_00, "USD", exchangeRate(1500)),
        expense(1, "Software", 15_000_00, "ARS"),
      ],
      "ARS",
    );
    expect(rows[0]?.amount).toEqual(money(30_000_00 + 15_000_00, "ARS"));
    expect(total).toEqual(money(45_000_00, "ARS"));
  });

  it("converts to USD using the registration rate", () => {
    const { total } = buildCategoryBreakdown([expense(1, "Comida", 15_000_00, "ARS", exchangeRate(1500))], "USD");
    expect(total).toEqual(money(10_00, "USD"));
  });

  it("breaks ties by label", () => {
    const { rows } = buildCategoryBreakdown([expense(2, "Zeta", 100), expense(1, "Alfa", 100)], "ARS");
    expect(rows.map((row) => row.label)).toEqual(["Alfa", "Zeta"]);
  });

  it("keeps eight categories without folding", () => {
    const expenses = Array.from({ length: 8 }, (_, index) => expense(index + 1, `Cat ${index + 1}`, 100 + index));
    const { rows } = buildCategoryBreakdown(expenses, "ARS");
    expect(rows).toHaveLength(8);
    expect(rows.some((row) => row.isOther)).toBe(false);
  });

  it("folds the tail into Otras when there are more than eight categories", () => {
    const expenses = Array.from({ length: 10 }, (_, index) => expense(index + 1, `Cat ${index + 1}`, 1000 - index * 100));
    const { rows, total } = buildCategoryBreakdown(expenses, "ARS");
    expect(rows).toHaveLength(8);
    const other = rows[7];
    expect(other).toMatchObject({ label: "Otras (3)", isOther: true, count: 3 });
    expect(other?.amount).toEqual(money(300 + 200 + 100, "ARS"));
    expect(rows.reduce((accumulated, row) => accumulated + row.amount.amount, 0)).toBe(total.amount);
  });

  it("makes shares add up to one", () => {
    const { rows } = buildCategoryBreakdown(
      [expense(1, "A", 333), expense(2, "B", 333), expense(3, "C", 334)],
      "ARS",
    );
    expect(rows.reduce((accumulated, row) => accumulated + row.share, 0)).toBeCloseTo(1);
  });
});

describe("formatShare", () => {
  it("rounds to whole percentages", () => {
    expect(formatShare(0.875)).toBe("88%");
    expect(formatShare(1)).toBe("100%");
  });

  it("does not show a tiny share as zero", () => {
    expect(formatShare(0.004)).toBe("<1%");
  });

  it("shows zero for an empty share", () => {
    expect(formatShare(0)).toBe("0%");
  });
});
