import { describe, expect, it } from "vitest";
import { convert, exchangeRate, money, parseAmountToCents, sum } from "./money";

const rate = exchangeRate(1200);

describe("convert", () => {
  it("returns the same value when currencies match", () => {
    const value = money(5000, "ARS");
    expect(convert(value, "ARS", rate)).toBe(value);
  });

  it("converts ARS to USD dividing by the rate", () => {
    expect(convert(money(120_000_00, "ARS"), "USD", rate)).toEqual(money(100_00, "USD"));
  });

  it("converts USD to ARS multiplying by the rate", () => {
    expect(convert(money(500_00, "USD"), "ARS", rate)).toEqual(money(600_000_00, "ARS"));
  });

  it("rounds to whole cents", () => {
    expect(convert(money(100_000, "ARS"), "USD", exchangeRate(1500))).toEqual(money(67, "USD"));
  });
});

describe("sum", () => {
  it("adds mixed currencies in the target currency", () => {
    const total = sum([money(1_200_00, "ARS"), money(1_00, "USD")], "ARS", rate);
    expect(total).toEqual(money(2_400_00, "ARS"));
  });

  it("returns zero for an empty list", () => {
    expect(sum([], "USD", rate)).toEqual(money(0, "USD"));
  });
});

describe("parseAmountToCents", () => {
  it("parses argentine formatted amounts", () => {
    expect(parseAmountToCents("1.234,56")).toBe(123_456);
  });

  it("parses integers", () => {
    expect(parseAmountToCents("500")).toBe(50_000);
  });

  it("rejects invalid input", () => {
    expect(() => parseAmountToCents("abc")).toThrow(RangeError);
    expect(() => parseAmountToCents("1,234")).toThrow(RangeError);
  });
});

describe("exchangeRate", () => {
  it("rejects non positive values", () => {
    expect(() => exchangeRate(0)).toThrow(RangeError);
    expect(() => exchangeRate(-1)).toThrow(RangeError);
  });
});
