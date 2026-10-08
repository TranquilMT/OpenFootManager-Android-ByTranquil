import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchStats, Lineups, EventFeed } from "./MatchPanels";
import type { MatchSnapshot, MatchEvent, EnginePlayerData } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const player = (id: string, condition = 80): EnginePlayerData => ({ id, name: id, position: "Midfielder", condition } as EnginePlayerData);
const event = (event_type: string, side: "Home" | "Away" = "Home"): MatchEvent => ({ event_type, minute: 30, side, zone: "Midfield", player_id: "p1", secondary_player_id: null });
const snapshot = (events: MatchEvent[] = []): MatchSnapshot => ({
  phase: "FirstHalf", current_minute: 30, home_team: { id: "h", name: "Home FC", formation: "4-4-2", players: [player("p1")] },
  away_team: { id: "a", name: "Away FC", formation: "4-4-2", players: [] }, home_bench: [], away_bench: [],
  events, substitutions: [], sent_off: [], home_yellows: {}, away_yellows: {}, home_possession_pct: 50, away_possession_pct: 50,
} as unknown as MatchSnapshot);
const row = (key: string) => screen.getByText(key).parentElement!;
describe("integrated match panels", () => {
  it("counts missed match penalties as shots without counting shootout kicks", () => {
    render(<MatchStats snapshot={snapshot([event("PenaltyMiss"), event("ShootoutGoal")])} />);
    expect(row("match.shots").firstElementChild).toHaveTextContent("1");
  });
  it("includes recorded on-target shots consistently with the pulse", () => {
    render(<MatchStats snapshot={snapshot([event("ShotOnTarget")])} />);
    expect(row("match.shotsOnTarget").firstElementChild).toHaveTextContent("1");
  });
  it("counts each booking including second-yellow dismissals", () => {
    const snap = snapshot([event("YellowCard"), event("SecondYellow")]);
    snap.home_yellows = { p1: 2 };
    render(<MatchStats snapshot={snap} />);
    expect(row("match.yellowCards").firstElementChild).toHaveTextContent("2");
  });
});
