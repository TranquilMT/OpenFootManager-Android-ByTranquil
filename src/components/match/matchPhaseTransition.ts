interface PhaseHandlers {
  half: (phase: "HalfTime" | "ExtraTimeHalfTime") => void;
  full: () => void;
  penalties?: () => void;
}
export function matchPhaseTransition(phase: string, finished: boolean, handlers: PhaseHandlers) {
  if (finished) return { phase: "Finished", callback: handlers.full };
  if (phase === "HalfTime" || phase === "ExtraTimeHalfTime")
    return { phase, callback: () => handlers.half(phase) };
  if (phase === "PenaltyShootout") return { phase, callback: () => handlers.penalties?.() };
  return null;
}
