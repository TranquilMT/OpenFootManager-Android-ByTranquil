import { describe, it, expect } from "vitest";
import { fixtureCongestion } from "./fixtureCongestion";
import type { FixtureData } from "../../store/types";
const fixture = (id: string, date: string, home = "ours") =>
  ({ id, date, home_team_id: home, away_team_id: "other", status: "Scheduled" }) as FixtureData;
describe("fixture congestion guidance", () => {
  it("uses upcoming club fixtures and deduplicates competition mirrors", () => {
    const fixtures = [
      fixture("a", "2026-08-11"),
      fixture("a", "2026-08-11"),
      fixture("b", "2026-08-13"),
      fixture("c", "2026-08-19"),
      fixture("outside", "2026-09-01"),
      fixture("foreign", "2026-08-12", "foreign"),
    ];
    expect(fixtureCongestion(fixtures, "ours", "2026-08-10T12:00:00Z")).toMatchObject({
      count: 3,
      minGap: 2,
      congested: true,
    });
  });
  it("leaves rest guidance unknown with fewer than two valid fixtures", () => {
    expect(fixtureCongestion([fixture("bad", "2026-02-30")], "ours", "2026-08-10")).toMatchObject({
      count: 0,
      minGap: null,
      congested: false,
    });
  });
  it("does not recommend rotation because of a club playing itself", () => {
    expect(fixtureCongestion([
      {...fixture("bad","2026-08-11"), away_team_id:"ours"},
      fixture("valid","2026-08-13")
    ],"ours","2026-08-10")).toMatchObject({count:1, minGap:null, congested:false});
  });
});
