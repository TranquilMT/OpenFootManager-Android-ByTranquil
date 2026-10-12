import { expect, it } from "vitest";
import { selectHighlights } from "./highlightCatalogue";
import type { MatchHighlight } from "./highlightModel";
const clip = (event_type: string, side: "Home" | "Away", minute = 10) =>
  ({
    id: `${event_type}:${side}:${minute}`,
    events: [],
    outcome: { event_type, side, minute },
  }) as MatchHighlight;
it("filters replay clips by the recorded club side", () => {
  const home = clip("Goal", "Home"),
    away = clip("Goal", "Away");
  expect(selectHighlights([home, away], { side: "Home" })).toEqual([home]);
  expect(selectHighlights([home, away], { side: "all" })).toEqual([home, away]);
});
