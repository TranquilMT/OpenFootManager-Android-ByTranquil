import { describe, expect, it } from "vitest";
import { buildTacticalInstructions, DEFAULT_TACTICS_PHASE } from "./tacticalInstructions";
import type { TacticsPhaseSettings } from "../../store/types";

describe("live tactical payloads", () => {
  it("sends individual changes without including unrelated snapshot settings", () => {
    expect(
      buildTacticalInstructions({ tempo: "Patient", pressing_intensity: "Aggressive" }),
    ).toEqual([{ Tempo: "Patient" }, { PressingIntensity: "Aggressive" }]);
  });
  it("rejects unsupported values and uses neutral engine-compatible defaults", () => {
    expect(
      buildTacticalInstructions({ tempo: "Maximum" } as unknown as Partial<TacticsPhaseSettings>),
    ).toEqual([]);
    expect(DEFAULT_TACTICS_PHASE.tempo).toBe("Direct");
    expect(DEFAULT_TACTICS_PHASE.pressing_intensity).toBe("Medium");
    expect(DEFAULT_TACTICS_PHASE.defensive_line).toBe("Medium");
  });
});
