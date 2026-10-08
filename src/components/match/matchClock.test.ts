import { describe, expect, it } from "vitest";
import { formatMatchMinute } from "./matchClock";
describe("phase-aware live clock", () => {
  it("distinguishes regulation and extra-time stoppage minutes", () => {
    expect(formatMatchMinute("FirstHalf", 48)).toBe("45+3");
    expect(formatMatchMinute("SecondHalf", 94)).toBe("90+4");
    expect(formatMatchMinute("ExtraTimeFirstHalf", 108)).toBe("105+3");
    expect(formatMatchMinute("ExtraTimeSecondHalf", 123)).toBe("120+3");
    expect(formatMatchMinute("ExtraTimeFirstHalf", 98)).toBe("98");
  });
  it("bounds malformed and fractional imported clock values", () => {
    expect(formatMatchMinute("FirstHalf", NaN)).toBe("0");
    expect(formatMatchMinute("FirstHalf", -4)).toBe("0");
    expect(formatMatchMinute("FirstHalf", 12.8)).toBe("12");
  });
});
