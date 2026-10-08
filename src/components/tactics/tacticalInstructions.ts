import type { TacticsPhaseSettings } from "../../store/types";

export const DEFAULT_TACTICS_PHASE: TacticsPhaseSettings = {
  build_up_style: "Mixed",
  width: "Normal",
  tempo: "Direct",
  defensive_line: "Medium",
  pressing_intensity: "Medium",
  defensive_shape: "Normal",
  marking_style: "Zonal",
  counter_press_duration: "None",
  break_speed: "Medium",
};
const COMMAND_NAMES = {
  tempo: "Tempo",
  pressing_intensity: "PressingIntensity",
  defensive_line: "DefensiveLine",
  width: "Width",
  build_up_style: "BuildUpStyle",
  marking_style: "MarkingStyle",
  defensive_shape: "DefensiveShape",
  counter_press_duration: "CounterPressDuration",
  break_speed: "BreakSpeed",
} as const;
const OPTIONS: Record<keyof TacticsPhaseSettings, readonly string[]> = {
  tempo: ["Patient", "Direct"],
  pressing_intensity: ["Passive", "Medium", "Aggressive"],
  defensive_line: ["VeryLow", "Low", "Medium", "High"],
  width: ["Narrow", "Normal", "Wide"],
  build_up_style: ["Short", "Mixed", "Long"],
  marking_style: ["Zonal", "Mixed", "ManToMan"],
  defensive_shape: ["Stretched", "Normal", "Compact"],
  counter_press_duration: ["None", "Short", "Long"],
  break_speed: ["Slow", "Medium", "Fast"],
};
export type TacticalInstruction = {
  [K in keyof TacticsPhaseSettings]: { [P in (typeof COMMAND_NAMES)[K]]: TacticsPhaseSettings[K] };
}[keyof TacticsPhaseSettings];

export function buildTacticalInstructions(
  patch: Partial<TacticsPhaseSettings>,
): TacticalInstruction[] {
  const instructions: TacticalInstruction[] = [];
  for (const field of Object.keys(COMMAND_NAMES) as Array<keyof TacticsPhaseSettings>) {
    const value = patch[field];
    if (value !== undefined && OPTIONS[field].includes(value)) {
      instructions.push({ [COMMAND_NAMES[field]]: value } as TacticalInstruction);
    }
  }
  return instructions;
}
