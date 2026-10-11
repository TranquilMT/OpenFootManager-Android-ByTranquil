import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LatestMatchCommentary from "./LatestMatchCommentary";
import type { MatchSnapshot, MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("./commentary", () => ({
  getCommentary: (event: MatchEvent) => ({
    headline: event.event_type,
    line: `Action ${event.player_id}`,
  }),
}));
const snapshot = {
  home_team: { name: "Home FC", players: [] },
  away_team: { name: "Away FC", players: [{ id: "now", name: "Away Striker" }] },
  phase: "FirstHalf",
  current_minute: 22,
  events: [
    { minute: 0, event_type: "KickOff", player_id: "start" },
    { minute: 22, event_type: "ShotOnTarget", side: "Away", player_id: "now" },
    { minute: 30, event_type: "Goal", player_id: "future" },
  ],
} as unknown as MatchSnapshot;
describe("latest commentary", () => {
  it("shows reached action rather than kickoff or a future event", () => {
    render(<LatestMatchCommentary snapshot={snapshot} />);
    expect(screen.getByText("Action now")).toBeInTheDocument();
    expect(screen.queryByText("Action start")).not.toBeInTheDocument();
    expect(screen.queryByText("Action future")).not.toBeInTheDocument();
  });
  it("respects concise event mode when commentary is disabled", () => {
    render(<LatestMatchCommentary snapshot={snapshot} showCommentary={false} />);
    expect(screen.queryByText("Action now")).not.toBeInTheDocument();
    expect(screen.getByText("Away Striker")).toBeInTheDocument();
    expect(screen.getByText("match.eventTypes.ShotOnTarget")).toBeInTheDocument();
  });
  it("identifies the team behind the latest action", () => {
    render(<LatestMatchCommentary snapshot={snapshot} />);
    expect(screen.getByText("Away FC")).toBeInTheDocument();
    expect(screen.queryByText("Home FC")).not.toBeInTheDocument();
  });
  it("keeps the latest half-time marker in its original stoppage-time phase", () => {
    render(
      <LatestMatchCommentary
        snapshot={
          {
            ...snapshot,
            phase: "SecondHalf",
            current_minute: 60,
            events: [
              { minute: 0, event_type: "KickOff", side: "Home", player_id: null },
              { minute: 48, event_type: "HalfTime", side: "Home", player_id: null },
            ],
          } as MatchSnapshot
        }
      />,
    );
    expect(screen.getByText("45+3'")).toBeInTheDocument();
    expect(screen.queryByText("48'")).not.toBeInTheDocument();
  });
  it("shows waiting text when no reached action exists", () => {
    render(<LatestMatchCommentary snapshot={{ ...snapshot, events: [] }} />);
    expect(screen.getByText("match.noEventsYet")).toBeInTheDocument();
  });
});
