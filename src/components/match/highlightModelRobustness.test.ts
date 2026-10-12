import { expect, it } from "vitest";
import { buildMatchHighlights } from "./highlightModel";
import type { MatchEvent } from "./types";
const event = (event_type: string, minute = 10, extra: Record<string, unknown> = {}): MatchEvent =>
  ({
    event_type,
    minute,
    side: "Home",
    zone: "AwayBox",
    player_id: "p1",
    secondary_player_id: null,
    ...extra,
  }) as MatchEvent;
it("rejects invalid team identities and resets their buildup", () => {
  const goal = event("Goal", 12);
  const clips = buildMatchHighlights(
    [event("PassCompleted"), event("Goal", 11, { side: "Neutral" }), goal],
    12,
  );
  expect(clips).toHaveLength(1);
  expect(clips[0].events).toEqual([goal]);
});

it("ignores shooting qualifiers attached to non-shooting events", () => {
  for (const event_type of ["PassCompleted", "Corner", "TacticalChange"])
    expect(buildMatchHighlights([event(event_type, 10, { detail: "Woodwork" })], 10)).toHaveLength(
      0,
    );
});

it("handles malformed optional chance details without breaking match playback", () => {
  for (const detail of [{ Shot: null }, { Save: null }, {}, []])
    expect(() => buildMatchHighlights([event("ShotSaved", 10, { detail })], 10)).not.toThrow();
});

it("ends a missed chance before the next attack even in key mode", () => {
  const goal = event("Goal", 12),
    pass = event("PassCompleted", 11);
  expect(
    buildMatchHighlights([event("PassCompleted", 9), event("ShotSaved"), pass, goal], 12)[0].events,
  ).toEqual([pass, goal]);
});

it("does not join a lost pass to a later same-side goal", () => {
  const goal = event("Goal", 12);
  expect(
    buildMatchHighlights([event("PassCompleted", 9), event("PassIntercepted"), goal], 12)[0].events,
  ).toEqual([goal]);
});

it("separates stopped play from the following attack", () => {
  const goal = event("Goal", 12);
  expect(
    buildMatchHighlights([event("PassCompleted", 9), event("Foul"), goal], 12)[0].events,
  ).toEqual([goal]);
});

it("keeps unsupported imported actions out of replay buildup", () => {
  const goal = event("Goal", 11);
  expect(buildMatchHighlights([event("ImportedBookkeeping"), goal], 11)[0].events).toEqual([goal]);
});

it("separates attacks across recorded substitutions and tactical changes", () => {
  for (const event_type of ["Substitution", "TacticalChange"]) {
    const goal = event("Goal", 12);
    expect(
      buildMatchHighlights([event("PassCompleted"), event(event_type, 11), goal], 12)[0].events,
    ).toEqual([goal]);
  }
});
