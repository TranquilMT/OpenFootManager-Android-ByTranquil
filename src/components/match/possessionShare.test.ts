import { expect, it } from "vitest";
import { possessionShare } from "./possessionShare";
it("preserves a valid possession split", () => {
  expect(possessionShare(56, 44)).toEqual({ home: 56, away: 44 });
});
it("keeps malformed possession finite and balanced", () => {
  expect(possessionShare(NaN, Infinity)).toEqual({ home: 50, away: 50 });
  expect(possessionShare(-20, 80)).toEqual({ home: 0, away: 100 });
  expect(possessionShare(80, 80)).toEqual({ home: 50, away: 50 });
});
