import { expect, it } from "vitest";
import { highlightParticipants } from "./highlightParticipants";
import type { MatchEvent } from "./types";
it("retains primary, secondary and recorded goalkeeper without duplicate actors", () => {
  const event = {
    player_id: "striker",
    secondary_player_id: "assist",
    shot: { expected_goals: 0.4, goalkeeper_id: "keeper" },
  } as MatchEvent;
  expect(highlightParticipants(event)).toEqual(["striker", "assist", "keeper"]);
  expect(highlightParticipants({ ...event, secondary_player_id: "striker", shot: null })).toEqual([
    "striker",
  ]);
  expect(
    highlightParticipants({ player_id: null, secondary_player_id: null } as MatchEvent),
  ).toEqual([]);
});
