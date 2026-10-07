import { describe, expect, it } from "vitest";
import { isLocalDerby } from "./derbyContext";
describe("local derby context", () => {
  it("requires both city and country to match", () => {
    expect(
      isLocalDerby({ city: "London", country: "England" }, { city: "London", country: "England" }),
    ).toBe(true);
    expect(
      isLocalDerby({ city: "London", country: "Canada" }, { city: "London", country: "England" }),
    ).toBe(false);
  });
  it("does not call unknown locations derbies", () => {
    expect(
      isLocalDerby(
        { city: "Unknown", country: "England" },
        { city: "Unknown", country: "England" },
      ),
    ).toBe(false);
    expect(isLocalDerby({}, {})).toBe(false);
  });
  it("ignores differences in spacing and case", () => {
    expect(
      isLocalDerby(
        { city: " London ", country: "ENGLAND" },
        { city: "london", country: "England" },
      ),
    ).toBe(true);
  });
});
