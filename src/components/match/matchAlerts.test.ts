import { describe, expect, it } from "vitest";
import type { MatchSnapshot, MatchEvent } from "./types";
import { matchAlerts } from "./matchAlerts";
const event = (event_type: string, player_id="hurt", minute=30, side:"Home"|"Away"="Home"):MatchEvent =>
  ({event_type,player_id,minute,side,secondary_player_id:null,zone:"Midfield"});
const snap = (events:MatchEvent[]) => ({phase:"FirstHalf",current_minute:35,
  home_team:{players:[{id:"hurt",name:"Hurt"},{id:"booked",name:"Booked"}]},
  away_team:{players:[]},events,sent_off:[],substitutions:[]}) as unknown as MatchSnapshot;
describe("actionable match alerts", () => {
  it("shows only current injuries for active players on the manager's side", () => {
    const snapshot=snap([event("Injury"),event("Injury","bench"),event("Injury","booked",40),event("Injury","opponent",30,"Away")]);
    expect(matchAlerts(snapshot,"Home").map(alert=>alert.event.player_id)).toEqual(["hurt"]);
    expect(matchAlerts({...snapshot,phase:"Finished"},"Home")).toEqual([]);
    snapshot.home_team.players=[];
    expect(matchAlerts(snapshot,"Home")).toEqual([]);
  });
  it("places dismissals above injury concerns and clears them after recorded tactical changes", () => {
    const snapshot=snap([event("Injury"),event("RedCard","dismissed",32)]);
    expect(matchAlerts(snapshot,"Home").map(alert=>alert.event.event_type)).toEqual(["RedCard","Injury"]);
    snapshot.events.push(event("TacticalChange","manager",33));
    expect(matchAlerts(snapshot,"Home").map(alert=>alert.event.event_type)).toEqual(["Injury"]);
  });
});
