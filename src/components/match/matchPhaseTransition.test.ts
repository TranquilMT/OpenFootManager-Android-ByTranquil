import { expect, it, vi } from "vitest";
import { matchPhaseTransition } from "./matchPhaseTransition";
it("selects only manager transitions and lets a finished result override its phase", () => {
  const half = vi.fn(),
    full = vi.fn(),
    penalties = vi.fn();
  const handlers = { half, full, penalties };
  expect(matchPhaseTransition("FirstHalf", false, handlers)).toBeNull();
  matchPhaseTransition("HalfTime", false, handlers)?.callback();
  expect(half).toHaveBeenCalledWith("HalfTime");
  matchPhaseTransition("ExtraTimeHalfTime", false, handlers)?.callback();
  expect(half).toHaveBeenLastCalledWith("ExtraTimeHalfTime");
  matchPhaseTransition("PenaltyShootout", false, handlers)?.callback();
  expect(penalties).toHaveBeenCalledOnce();
  const finished = matchPhaseTransition("SecondHalf", true, handlers);
  expect(finished?.phase).toBe("Finished");
  finished?.callback();
  expect(full).toHaveBeenCalledOnce();
});
