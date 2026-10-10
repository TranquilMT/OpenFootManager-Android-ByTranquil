import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchStats, Lineups, EventFeed } from "./MatchPanels";
import type { MatchSnapshot, MatchEvent, EnginePlayerData } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const player = (id: string, condition = 80): EnginePlayerData =>
  ({ id, name: id, position: "Midfielder", condition }) as EnginePlayerData;
const event = (event_type: string, side: "Home" | "Away" = "Home"): MatchEvent => ({
  event_type,
  minute: 30,
  side,
  zone: "Midfield",
  player_id: "p1",
  secondary_player_id: null,
});
const snapshot = (events: MatchEvent[] = []): MatchSnapshot =>
  ({
    phase: "FirstHalf",
    current_minute: 30,
    home_team: { id: "h", name: "Home FC", formation: "4-4-2", players: [player("p1")] },
    away_team: { id: "a", name: "Away FC", formation: "4-4-2", players: [] },
    home_bench: [],
    away_bench: [],
    events,
    substitutions: [],
    sent_off: [],
    home_yellows: {},
    away_yellows: {},
    home_possession_pct: 50,
    away_possession_pct: 50,
  }) as unknown as MatchSnapshot;
const row = (key: string) => {
  const element = screen.getByText(key).parentElement;
  if (!element) throw new Error("Missing statistic row");
  return element;
};
describe("integrated match panels", () => {
  it("live statistics exclude future shots and bookings", () => {
    const future = { ...event("ShotOnTarget"), minute: 90 };
    render(<MatchStats snapshot={snapshot([future])} />);
    expect(row("match.shots").firstElementChild).toHaveTextContent("0");
  });
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
  it("shows direct and second-yellow dismissals in the statistics", () => {
    render(<MatchStats snapshot={snapshot([event("RedCard"), event("SecondYellow", "Away")])} />);
    expect(row("match.eventTypes.RedCard").firstElementChild).toHaveTextContent("1");
    expect(row("match.eventTypes.RedCard").lastElementChild).toHaveTextContent("1");
  });
  it("bounds displayed player condition and uses shared colour thresholds", () => {
    const snap = snapshot();
    snap.home_team.players = [player("p1", 150), player("p2", -20), player("p3", 72)];
    const view = render(<Lineups snapshot={snap} />);
    expect(screen.queryByText("150")).not.toBeInTheDocument();
    expect(screen.queryByText("-20")).not.toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(view.container.querySelector('[style="width: 72%;"]')).toHaveClass("bg-amber-500");
  });
  it("translates positional group headings", () => {
    render(<Lineups snapshot={snapshot()} />);
    expect(screen.getByText("common.positions.Midfielder")).toBeInTheDocument();
    expect(screen.queryByText("Midfielders")).not.toBeInTheDocument();
  });
  it("shows assigned shirt numbers beside starters and reserves", () => {
    const snap = snapshot();
    snap.home_bench = [player("reserve")];
    render(
      <Lineups
        snapshot={snap}
        playerJerseyMap={
          new Map([
            ["p1", 8],
            ["reserve", 12],
          ])
        }
      />,
    );
    expect(screen.getByText("#8")).toBeInTheDocument();
    expect(screen.getByText("#12")).toBeInTheDocument();
  });
  it("marks dismissed reserves as unavailable rather than showing an ordinary bench row", () => {
    const snap = snapshot();
    snap.home_bench = [player("reserve")];
    snap.sent_off = ["reserve"];
    render(<Lineups snapshot={snap} />);
    expect(screen.getByText("reserve").closest('[aria-disabled="true"]')).not.toBeNull();
  });
  it("offers expandable recorded participants and shot quality", () => {
    const shot = { ...event("ShotSaved"), shot: { expected_goals: 0.35, goalkeeper_id: "keeper" } };
    const snap = snapshot([shot]);
    snap.away_team.players = [player("keeper")];
    render(<EventFeed events={[shot]} snapshot={snap} showCommentary={false} />);
    expect(screen.getByText("match.viewDetails").closest("details")).not.toBeNull();
    expect(screen.getByText("0.35")).toBeInTheDocument();
    expect(screen.getByText("keeper")).toBeInTheDocument();
  });
  it("keeps expanded details attached to their event when earlier rows are inserted", () => {
    const goal = event("Goal");
    const snap = snapshot([goal]);
    const view = render(<EventFeed events={[goal]} snapshot={snap} showCommentary={false} />);
    const original = screen.getByText("match.viewDetails").closest("details");
    if (!original) throw new Error("Missing event details");
    original.open = true;
    view.rerender(
      <EventFeed
        events={[{ ...event("YellowCard"), minute: 10 }, goal]}
        snapshot={snap}
        showCommentary={false}
      />,
    );
    const details = screen.getAllByText("match.viewDetails").map((node) => node.closest("details"));
    expect(details[0]?.open).toBe(false);
    expect(details[1]?.open).toBe(true);
  });
  it("does not label an empty filtered timeline as waiting for kickoff", () => {
    render(<EventFeed events={[]} snapshot={snapshot([event("Goal")])} />);
    expect(screen.getByText("match.noEventsYet")).toBeInTheDocument();
    expect(screen.queryByText("match.waitingKickoff")).not.toBeInTheDocument();
  });

  it("does not reuse React keys when the same event object appears twice", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const goal = event("Goal");
      render(
        <EventFeed
          events={[goal, goal]}
          snapshot={snapshot([goal, goal])}
          showCommentary={false}
        />,
      );
      expect(error).not.toHaveBeenCalled();
      expect(screen.getAllByText("match.viewDetails")).toHaveLength(2);
    } finally {
      error.mockRestore();
    }
  });

  it("does not show a scorer as their own assist when commentary is off", () => {
    const goal = { ...event("Goal"), secondary_player_id: "p1" };
    render(<EventFeed events={[goal]} snapshot={snapshot([goal])} showCommentary={false} />);
    expect(screen.queryByText(/match.assist/)).not.toBeInTheDocument();
  });
});
