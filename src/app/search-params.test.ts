import { describe, expect, it } from "vitest";
import { resolveCurrency, resolveMonth } from "./search-params.ts";

describe("resolveMonth", () => {
  it("accepts a valid month", () => {
    expect(resolveMonth("2026-05", "2026-11")).toBe("2026-05");
  });

  it("falls back for invalid, repeated or missing values", () => {
    expect(resolveMonth("basura", "2026-11")).toBe("2026-11");
    expect(resolveMonth(["2026-05", "2026-06"], "2026-11")).toBe("2026-11");
    expect(resolveMonth(undefined, "2026-11")).toBe("2026-11");
  });
});

describe("resolveCurrency", () => {
  it("accepts supported currencies", () => {
    expect(resolveCurrency("USD", "ARS")).toBe("USD");
  });

  it("falls back otherwise", () => {
    expect(resolveCurrency("EUR", "ARS")).toBe("ARS");
    expect(resolveCurrency(undefined, "ARS")).toBe("ARS");
  });
});
