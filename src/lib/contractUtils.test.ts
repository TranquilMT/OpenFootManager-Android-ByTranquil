import { describe, expect, it } from "vitest";
import { getDaysUntil, getContractYearsRemaining } from "./contractUtils";
describe("contract calendar estimates", () => {
  it("measures valid leap-day calendar differences", () => {
    expect(getDaysUntil("2028-03-01", "2028-02-28")).toBe(2);
  });
  it("leaves impossible calendar dates unknown", () => {
    expect(getDaysUntil("2026-02-30", "2026-02-20")).toBeNaN();
    expect(getDaysUntil("2026-03-01", "2026-02-30")).toBeNaN();
  });
});
