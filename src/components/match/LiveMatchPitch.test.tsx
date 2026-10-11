import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LiveMatchPitch from "./LiveMatchPitch";
import type { EnginePlayerData, MatchSnapshot } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const makePlayers = (side: string) =>
  Array.from(
    { length: 11 },
    (_, i) =>
      ({
        id: `${side}${i}`,
        name: `${side} player ${i}`,
        position: i === 0 ? "Goalkeeper" : "Midfielder",
        condition: 100,
      }) as EnginePlayerData,
  );
const snapshot = {
  home_team: { name: "Home", formation: "4-4-2", players: makePlayers("home") },
  away_team: { name: "Away", formation: "4-4-2", players: makePlayers("away") },
  sent_off: [],
  events: [],
  current_minute: 22,
  ball_zone: "Midfield",
  possession: "Home",
} as unknown as MatchSnapshot;
describe("combined live pitch", () => {
  it("shows all 22 players in one labelled tactical view", () => {
    render(<LiveMatchPitch snapshot={snapshot} />);
    expect(screen.getByRole("figure", { name: "match.pitchView" })).toBeInTheDocument();
    expect(screen.getAllByTitle(/player/)).toHaveLength(22);
    expect(screen.getByText("match.shapeOnly")).toBeInTheDocument();
  });
  it("allows only the manager's active players to open decisions", () => {
    const onPlayer = vi.fn();
    render(
      <LiveMatchPitch
        snapshot={{ ...snapshot, sent_off: ["home3"] }}
        userSide="Home"
        onPlayer={onPlayer}
      />,
    );
    expect(screen.queryByTitle("home player 3")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "home player 4" }));
    expect(onPlayer).toHaveBeenCalledWith("home4");
  });
  it("identifies booked players without replacing their jersey", () => {
    render(
      <LiveMatchPitch
        snapshot={{ ...snapshot, home_yellows: { home4: 1 }, away_yellows: {} }}
        playerJerseyMap={new Map([["home4", 8]])}
      />,
    );
    const player = screen.getByTitle("home player 4");
    expect(player).toHaveTextContent("8");
    expect(player.querySelector('[aria-label="match.eventTypes.YellowCard"]')).toBeInTheDocument();
    expect(screen.getAllByLabelText("match.eventTypes.YellowCard")).toHaveLength(1);
  });
  it("marks only substitutes who have entered by the current minute", () => {
    render(
      <LiveMatchPitch
        snapshot={{
          ...snapshot,
          substitutions: [
            { minute: 20, side: "Home", player_off_id: "old", player_on_id: "home4" },
            { minute: 30, side: "Away", player_off_id: "old2", player_on_id: "away4" },
          ],
        }}
      />,
    );
    expect(
      screen
        .getByTitle("home player 4")
        .querySelector('[aria-label="match.eventTypes.Substitution"]'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByTitle("away player 4")
        .querySelector('[aria-label="match.eventTypes.Substitution"]'),
    ).not.toBeInTheDocument();
  });
  it("clears stale player highlights when the next minute has no action", () => {
    const event = { minute: 21, side: "Home", player_id: "home4", event_type: "ShotOnTarget" };
    const view = render(
      <LiveMatchPitch
        snapshot={{ ...snapshot, current_minute: 21, events: [event] } as MatchSnapshot}
      />,
    );
    expect(screen.getByTitle("home player 4")).toHaveClass("ring-2");
    view.rerender(<LiveMatchPitch snapshot={{ ...snapshot, events: [event] } as MatchSnapshot} />);
    expect(screen.getByTitle("home player 4")).not.toHaveClass("ring-2");
  });
  it("updates the ball to recorded zones and removes it for an unknown location", () => {
    const view = render(<LiveMatchPitch snapshot={{ ...snapshot, ball_zone: "HomeBox" }} />);
    expect(view.container.querySelector('[data-ball-zone="HomeBox"]')).toHaveStyle({ left: "8%" });
    view.rerender(<LiveMatchPitch snapshot={{ ...snapshot, ball_zone: "AwayDefense" }} />);
    expect(view.container.querySelector('[data-ball-zone="AwayDefense"]')).toHaveStyle({
      left: "75%",
    });
    view.rerender(<LiveMatchPitch snapshot={{ ...snapshot, ball_zone: "Unknown" }} />);
    expect(view.container.querySelector("[data-ball-zone]")).not.toBeInTheDocument();
  });
  it("identifies the goalkeeper slot even when an outfield player covers it", () => {
    const homePlayers = snapshot.home_team.players.map((player, index) =>
      index === 0 ? { ...player, position: "Forward" } : player,
    );
    render(
      <LiveMatchPitch
        snapshot={{ ...snapshot, home_team: { ...snapshot.home_team, players: homePlayers } }}
      />,
    );
    expect(screen.getAllByLabelText("common.positions.Goalkeeper")).toHaveLength(2);
    expect(screen.getByTitle("home player 0")).toHaveTextContent("common.posAbbr.Goalkeeper");
    expect(screen.getByTitle("home player 4")).not.toHaveTextContent("common.posAbbr.Goalkeeper");
  });
  it("does not expose decisions while a command is pending", () => {
    render(<LiveMatchPitch snapshot={snapshot} userSide="Home" onPlayer={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "home player 4" })).toBeDisabled();
  });
});
