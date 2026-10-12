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

it("separates goal, chance and incident catalogues", () => {
  const clips = [clip("Goal", "Home"), clip("ShotSaved", "Home"), clip("Injury", "Away")];
  expect(selectHighlights(clips, { category: "goals" })).toEqual([clips[0]]);
  expect(selectHighlights(clips, { category: "chances" })).toEqual(clips.slice(0, 2));
  expect(selectHighlights(clips, { category: "incidents" })).toEqual([clips[2]]);
});
