import { describe, expect, it } from "vitest";
import {
  formatDisplayDate,
  formatDisplayMonth,
  isIsoDate,
  isIsoMonth,
  monthOfDate,
  parseDisplayDate,
  shiftMonth,
  toIsoDate,
  toIsoMonth,
} from "./dates.ts";

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

describe("display formatting", () => {
  it("formats an ISO date as dd/mm/aaaa", () => {
    expect(formatDisplayDate("2026-11-04")).toBe("04/11/2026");
    expect(formatDisplayDate("2026-01-31")).toBe("31/01/2026");
  });

  it("formats an ISO month as mm/aaaa", () => {
    expect(formatDisplayMonth("2026-11")).toBe("11/2026");
  });

  it("rejects values that are not ISO", () => {
    expect(() => formatDisplayDate("04/11/2026")).toThrow(RangeError);
    expect(() => formatDisplayDate("2026-02-30")).toThrow(RangeError);
    expect(() => formatDisplayMonth("2026-13")).toThrow(RangeError);
  });
});

describe("parseDisplayDate", () => {
  it("converts dd/mm/aaaa to an ISO date", () => {
    expect(parseDisplayDate("04/11/2026")).toBe("2026-11-04");
  });

  it("accepts days and months without zero padding and surrounding spaces", () => {
    expect(parseDisplayDate(" 4/1/2026 ")).toBe("2026-01-04");
  });

  it("rejects impossible dates", () => {
    expect(parseDisplayDate("30/02/2026")).toBeNull();
    expect(parseDisplayDate("31/04/2026")).toBeNull();
    expect(parseDisplayDate("29/02/2028")).toBe("2028-02-29");
  });

  it("rejects other formats, including ISO and month-first ordering", () => {
    expect(parseDisplayDate("2026-11-04")).toBeNull();
    expect(parseDisplayDate("11-04-2026")).toBeNull();
    expect(parseDisplayDate("04/11/26")).toBeNull();
    expect(parseDisplayDate("")).toBeNull();
  });

  it("round trips with formatDisplayDate", () => {
    expect(parseDisplayDate(formatDisplayDate("2026-12-31"))).toBe("2026-12-31");
  });
});

describe("monthOfDate", () => {
  it("returns the month of an ISO date", () => {
    expect(monthOfDate("2026-12-31")).toBe("2026-12");
  });

  it("rejects invalid dates", () => {
    expect(() => monthOfDate("2026-02-30")).toThrow(RangeError);
  });
});
