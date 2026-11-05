import { describe, expect, it } from "vitest";
import { isIsoDate, isIsoMonth, shiftMonth, toIsoDate, toIsoMonth } from "./dates.ts";

describe("dates", () => {
  it("formats a local date with zero padding", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("formats a local month with zero padding", () => {
    expect(toIsoMonth(new Date(2026, 10, 30))).toBe("2026-11");
  });
});

describe("shiftMonth", () => {
  it("moves within a year", () => {
    expect(shiftMonth("2026-05", 1)).toBe("2026-06");
    expect(shiftMonth("2026-05", -1)).toBe("2026-04");
  });

  it("crosses year boundaries in both directions", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-01", -13)).toBe("2024-12");
  });

  it("rejects malformed months", () => {
    expect(() => shiftMonth("2026-13", 1)).toThrow(RangeError);
  });
});

describe("validation helpers", () => {
  it("validates months", () => {
    expect(isIsoMonth("2026-11")).toBe(true);
    expect(isIsoMonth("2026-00")).toBe(false);
    expect(isIsoMonth("26-11")).toBe(false);
  });

  it("validates real calendar dates", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-2-3")).toBe(false);
  });
});
