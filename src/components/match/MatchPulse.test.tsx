import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchPulse } from "./MatchPulse";
import type { MatchEvent, MatchSnapshot } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const event = (minute: number, side: "Home" | "Away", xg?: number): MatchEvent => ({
  minute,
  side,
  event_type: "ShotSaved",
  player_id: "p",
  secondary_player_id: "gk",
  zone: "AwayBox",
  shot: xg === undefined ? null : { expected_goals: xg, goalkeeper_id: "gk" },
});
const snapshot = (events: MatchEvent[]): MatchSnapshot =>
  ({
    current_minute: 80,
    events,
    home_team: { name: "Home FC" },
    away_team: { name: "Away FC" },
  }) as MatchSnapshot;
describe("Match Pulse integration", () => {
  it("shows recorded chance probabilities even when the shot is saved", () => {
    render(<MatchPulse snapshot={snapshot([event(79, "Home", 0.25)])} />);
    expect(screen.getByText("0.25")).toBeInTheDocument();
  });
  it("leaves old-report quality unavailable rather than inventing zero", () => {
    render(<MatchPulse snapshot={snapshot([event(79, "Home")])} />);
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
  it("only derives pressure from the last five minutes", () => {
    render(<MatchPulse snapshot={snapshot([event(50, "Home"), event(79, "Away")])} />);
    expect(screen.getByText("phase70.metrics.pressure: Away FC")).toBeInTheDocument();
  });
  it("shows a verified derby label only when explicitly supplied", () => {
    render(<MatchPulse derby snapshot={snapshot([])} />);
    expect(screen.getByText("phase70.metrics.derby")).toBeInTheDocument();
  });
});
