import { describe, expect, it } from "vitest";
import {
  categoryFormSchema,
  expenseFormSchema,
  fixedExpenseActiveFormSchema,
  fixedExpenseFormSchema,
  incomeFormSchema,
  investmentGoalFormSchema,
  rateFormSchema,
} from "./form-schemas.ts";

describe("form schemas", () => {
  it("parses an argentine formatted income", () => {
    expect(incomeFormSchema.parse({ amount: "2.000.000,50" }).amount).toBe(200_000_050);
  });

  it("rejects an invalid income with a readable message", () => {
    const result = incomeFormSchema.safeParse({ amount: "mucho" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("monto válido");
  });

  it("parses the investment goal with its currency", () => {
    expect(investmentGoalFormSchema.parse({ amount: "500", currency: "USD" })).toEqual({
      amount: 50_000,
      currency: "USD",
    });
  });

  it("rejects unsupported currencies", () => {
    expect(investmentGoalFormSchema.safeParse({ amount: "500", currency: "EUR" }).success).toBe(false);
  });

  it("parses the exchange rate as a decimal number", () => {
    expect(rateFormSchema.parse({ rate: "1.588,60" }).rate).toBe(1588.6);
  });

  it("rejects a zero exchange rate", () => {
    expect(rateFormSchema.safeParse({ rate: "0" }).success).toBe(false);
  });

  it("trims category names and rejects empty ones", () => {
    expect(categoryFormSchema.parse({ name: "  Food " }).name).toBe("Food");
    expect(categoryFormSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("requires a positive amount for fixed expenses", () => {
    expect(fixedExpenseFormSchema.safeParse({ name: "Rent", amount: "0", currency: "ARS" }).success).toBe(false);
    expect(fixedExpenseFormSchema.parse({ name: "Claude", amount: "20", currency: "USD" })).toEqual({
      name: "Claude",
      amount: 2_000,
      currency: "USD",
    });
  });

  it("parses the active flag", () => {
    expect(fixedExpenseActiveFormSchema.parse({ id: "3", active: "false" })).toEqual({ id: 3, active: false });
    expect(fixedExpenseActiveFormSchema.safeParse({ id: "3", active: "maybe" }).success).toBe(false);
  });

  it("parses an expense with and without category", () => {
    const base = { date: "04/11/2026", description: " Lunch ", amount: "5.000", currency: "ARS" };
    expect(expenseFormSchema.parse({ ...base, categoryId: "" })).toEqual({
      date: "2026-11-04",
      description: "Lunch",
      amount: 500_000,
      currency: "ARS",
      categoryId: null,
    });
    expect(expenseFormSchema.parse({ ...base, categoryId: "7" }).categoryId).toBe(7);
  });

  it("rejects impossible dates and empty descriptions", () => {
    const base = { amount: "10", currency: "ARS", categoryId: "" };
    expect(expenseFormSchema.safeParse({ ...base, date: "30/02/2026", description: "x" }).success).toBe(false);
    expect(expenseFormSchema.safeParse({ ...base, date: "10/02/2026", description: "  " }).success).toBe(false);
  });

  it("only accepts dates written as dd/mm/aaaa", () => {
    const base = { description: "x", amount: "10", currency: "ARS", categoryId: "" };
    expect(expenseFormSchema.safeParse({ ...base, date: "2026-02-10" }).success).toBe(false);
    const result = expenseFormSchema.safeParse({ ...base, date: "hoy" });
    expect(result.error?.issues[0]?.message).toContain("dd/mm/aaaa");
  });
});
