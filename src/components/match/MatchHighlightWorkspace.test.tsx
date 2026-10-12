import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import MatchHighlightWorkspace from "./MatchHighlightWorkspace";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const snapshot = {
  ...createSnapshot(),
  events: [
    {
      event_type: "Goal",
      minute: 20,
      side: "Home",
      zone: "AwayBox",
      player_id: "starter-1",
      secondary_player_id: null,
    } as MatchEvent,
  ],
};
it("opens a clip and reports replay ownership until close or disposal", () => {
  const ownership = vi.fn();
  const { unmount } = render(
    <MatchHighlightWorkspace snapshot={snapshot} onReplayChange={ownership} />,
  );
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  expect(ownership).toHaveBeenLastCalledWith(true);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "common.close" }));
  expect(ownership).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  unmount();
  expect(ownership).toHaveBeenLastCalledWith(false);
});
it("keeps commentary-only mode within the reached match clock", () => {
  const future = { ...snapshot.events[0], minute: 60, event_type: "RedCard" };
  render(
    <MatchHighlightWorkspace snapshot={{ ...snapshot, events: [...snapshot.events, future] }} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "match.events" }));
  expect(screen.queryByText("60'")).not.toBeInTheDocument();
});

it("captures replay data without sharing mutable source objects", () => {
  const mutable = {
    ...snapshot,
    home_team: {
      ...snapshot.home_team,
      players: snapshot.home_team.players.map((p) => ({ ...p })),
    },
  };
  const { rerender } = render(<MatchHighlightWorkspace snapshot={mutable} />);
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  mutable.home_team.players[0].name = "Changed after selection";
  rerender(<MatchHighlightWorkspace snapshot={{ ...mutable }} />);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("Starter One");
  expect(dialog).not.toHaveTextContent("Changed after selection");
});

it("releases an old replay when another fixture or rewound match arrives", () => {
  const change = vi.fn();
  const { rerender } = render(
    <MatchHighlightWorkspace snapshot={snapshot} onReplayChange={change} />,
  );
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  rerender(
    <MatchHighlightWorkspace
      snapshot={{ ...snapshot, home_team: { ...snapshot.home_team, id: "another-club" } }}
      onReplayChange={change}
    />,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(change).toHaveBeenLastCalledWith(false);
});

it("keeps replay ownership active when the parent callback changes", () => {
  const first = vi.fn(),
    second = vi.fn();
  const { rerender } = render(
    <MatchHighlightWorkspace snapshot={snapshot} onReplayChange={first} />,
  );
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  rerender(<MatchHighlightWorkspace snapshot={snapshot} onReplayChange={second} />);
  expect(second).toHaveBeenLastCalledWith(true);
});

it("captures a filtered playlist and navigates without returning to the catalogue", () => {
  const second = { ...snapshot.events[0], minute: 30, event_type: "PenaltyGoal" };
  render(
    <MatchHighlightWorkspace
      snapshot={{ ...snapshot, current_minute: 30, events: [...snapshot.events, second] }}
    />,
  );
  fireEvent.click(screen.getAllByRole("button", { name: /match.highlights.replay/ })[0]);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.nextClip" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("match.eventTypes.Goal");
  expect(screen.getByRole("button", { name: "match.highlights.nextClip" })).toBeDisabled();
});

afterEach(() => localStorage.clear());

it("does not open a replay while a live match command is pending", () => {
  render(<MatchHighlightWorkspace snapshot={snapshot} replayDisabled />);
  const replay = screen.getByRole("button", { name: /match.highlights.replay/ });
  expect(replay).toBeDisabled();
  fireEvent.click(replay);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
