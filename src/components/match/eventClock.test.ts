import { describe, expect, it } from "vitest";
import { eventClockLabels } from "./eventClock";
import type { MatchEvent } from "./types";
const makeEvents = (entries: [string, number][]) =>
  entries.map(([event_type, minute]) => ({ event_type, minute }) as MatchEvent);
describe("recorded event clocks", () => {
  it("preserves historical stoppage time through all phase transitions", () => {
    const events = makeEvents([
      ["KickOff", 0],
      ["Goal", 47],
      ["HalfTime", 48],
      ["SecondHalfStart", 48],
      ["Goal", 94],
      ["KickOff", 95],
      ["Goal", 106],
      ["HalfTime", 107],
      ["SecondHalfStart", 107],
      ["Goal", 122],
      ["FullTime", 123],
    ]);
    expect(Array.from(eventClockLabels(events).values())).toEqual([
      "0",
      "45+2",
      "45+3",
      "48",
      "90+4",
      "95",
      "105+1",
      "105+2",
      "107",
      "120+2",
      "120+3",
    ]);
  });
  it("does not fabricate phase boundaries when imported events lack markers", () => {
    const events = makeEvents([
      ["Goal", 47],
      ["Goal", 94],
    ]);
    expect(Array.from(eventClockLabels(events).values())).toEqual(["47", "94"]);
  });
  it("does not let an old event at a shared boundary minute inherit the new phase", () => {
    const events = makeEvents([
      ["KickOff", 0],
      ["Goal", 48],
      ["HalfTime", 48],
      ["SecondHalfStart", 48],
      ["Goal", 48],
    ]);
    expect(Array.from(eventClockLabels(events).values())).toEqual([
      "0",
      "45+3",
      "45+3",
      "48",
      "48",
    ]);
  });
});
