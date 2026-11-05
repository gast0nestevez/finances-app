import { describe, expect, it } from "vitest";
import {
  categoryFormSchema,
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
});
