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
  it("does not expose decisions while a command is pending", () => {
    render(<LiveMatchPitch snapshot={snapshot} userSide="Home" onPlayer={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "home player 4" })).toBeDisabled();
  });
});
