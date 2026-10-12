import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
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
