import { describe, expect, it } from "vitest";
import { toIsoDate, toIsoMonth } from "./dates.ts";

describe("dates", () => {
  it("formats a local date with zero padding", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("formats a local month with zero padding", () => {
    expect(toIsoMonth(new Date(2026, 10, 30))).toBe("2026-11");
  });
});
