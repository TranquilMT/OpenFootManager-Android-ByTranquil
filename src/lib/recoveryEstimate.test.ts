import { describe, it, expect } from "vitest";
import { estimatedRecoveryDate } from "./recoveryEstimate";
describe("dated medical recovery estimates", () => {
  it("advances the career date across month and year boundaries", () => {
    expect(estimatedRecoveryDate("2026-12-30T15:00:00Z", 3)).toBe("2027-01-02");
    expect(estimatedRecoveryDate("2028-02-28", 2)).toBe("2028-03-01");
    expect(estimatedRecoveryDate("2026-08-10", 0)).toBe("2026-08-10");
  });
  it("keeps invalid medical durations and clock dates unknown", () => {
    for (const days of [-1, NaN, Infinity, 1.5])
      expect(estimatedRecoveryDate("2026-08-10", days)).toBeNull();
    expect(estimatedRecoveryDate("2026-02-30", 3)).toBeNull();
  });
});
