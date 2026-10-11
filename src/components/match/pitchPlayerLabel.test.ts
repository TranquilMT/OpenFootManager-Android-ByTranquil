import { describe, expect, it } from "vitest";
import { pitchPlayerLabel } from "./pitchPlayerLabel";

describe("pitch identity labels", () => {
  it("uses a valid allocated jersey instead of initials", () => {
    expect(pitchPlayerLabel("Bruno Fernandes", 8)).toBe("8");
  });
  it.each([0, -3, NaN, Infinity, 4.5, undefined])(
    "falls back to initials for invalid jersey %s",
    (jersey) => {
      expect(pitchPlayerLabel("  Bruno   Fernandes  ", jersey)).toBe("BF");
    },
  );
  it("keeps a non-Latin player identifiable and handles missing names", () => {
    expect(pitchPlayerLabel("孙 兴慜")).toBe("孙兴");
    expect(pitchPlayerLabel("   ")).toBe("?");
  });
});
