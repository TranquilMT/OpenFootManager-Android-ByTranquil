import type { FixtureData } from "../../store/types";
import { describe, expect, it } from "vitest";
import { expectedPromiseDeadline } from "./promiseTracker";

const fixture = (
  id: string,
  date: string,
  home = "ours",
  status: FixtureData["status"] = "Scheduled",
) => ({ id, date, home_team_id: home, away_team_id: "other", status });

describe("expected playing-time promise deadline", () => {
  it("counts only future scheduled club matches and deduplicates the league mirror", () => {
    const matches = [
      fixture("past", "2026-08-01"),
      fixture("away", "2026-08-20", "foreign"),
      fixture("one", "2026-08-12"),
      fixture("one", "2026-08-12"),
      fixture("two", "2026-08-15"),
      fixture("done", "2026-08-13", "ours", "Completed"),
    ];
    expect(expectedPromiseDeadline(matches, "ours", "2026-08-10", 2, false)).toBe("2026-08-15");
  });
  it("does not invent a date while injured or when too few matches are scheduled", () => {
    const matches = [fixture("one", "2026-08-12")];
    expect(expectedPromiseDeadline(matches, "ours", "2026-08-10", 1, true)).toBeNull();
    expect(expectedPromiseDeadline(matches, "ours", "2026-08-10", 2, false)).toBeNull();
  });

 it("includes a fixture on the current calendar day",()=>{
  expect(expectedPromiseDeadline([fixture("one","2026-08-10")],"ours","2026-08-10T15:00:00Z",1,false)).toBe("2026-08-10");
 });







 it("projects the first actual kickoff when timestamp offsets differ",()=>{
  const fixtures=[fixture("later","2026-08-12T00:00:00-05:00"),fixture("earlier","2026-08-12T02:00:00Z")];
  expect(expectedPromiseDeadline(fixtures,"ours","2026-08-10",1,false)).toBe("2026-08-12T02:00:00Z");
 });


});
