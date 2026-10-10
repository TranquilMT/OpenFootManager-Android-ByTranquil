import { describe, expect, it } from "vitest";
import { getDaysUntil, getContractYearsRemaining } from "./contractUtils";
describe("contract calendar estimates", () => {
  it("remaining contract days use the UTC career calendar", () => {
    expect(getDaysUntil("2026-07-10T23:59:00Z", "2026-07-10T00:01:00Z")).toBe(0);
    expect(getDaysUntil("2026-07-11T00:01:00Z", "2026-07-10T23:59:00Z")).toBe(1);
  });
  it("measures valid leap-day calendar differences", () => {
    expect(getDaysUntil("2028-03-01", "2028-02-28")).toBe(2);
  });
  it("leaves impossible calendar dates unknown", () => {
    expect(getDaysUntil("2026-02-30", "2026-02-20")).toBeNaN();
    expect(getDaysUntil("2026-03-01", "2026-02-30")).toBeNaN();
  });
  it("shows the unknown marker for invalid remaining-year dates", () => {
    expect(getContractYearsRemaining("invalid", "2026-07-10")).toBe("—");
    expect(getContractYearsRemaining("2027-07-10", "invalid")).toBe("—");
  });
});
