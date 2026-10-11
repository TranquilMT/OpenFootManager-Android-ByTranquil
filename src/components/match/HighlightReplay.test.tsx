import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightReplay from "./HighlightReplay";
import { createSnapshot } from "./SubPanel.testFixtures";
import { buildMatchHighlights } from "./highlightModel";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const goal = {
  event_type: "Goal",
  minute: 10,
  side: "Home",
  zone: "AwayBox",
  player_id: "starter-1",
  secondary_player_id: null,
} as MatchEvent;
const pass = { ...goal, event_type: "PassCompleted", minute: 9, zone: "AwayDefense" };
const snapshot = {
  ...createSnapshot(),
  events: [{ ...goal, event_type: "KickOff", minute: 0 }, pass, goal],
};
const clip = buildMatchHighlights(snapshot.events, 10)[0];
it("opens a named replay, starts from the first recorded action and closes cleanly", () => {
  const close = vi.fn();
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={close} />);
  expect(screen.getByRole("dialog", { name: "match.highlights.replay" })).toBeInTheDocument();
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
  expect(screen.getByText("0 – 0")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "common.close" }));
  expect(close).toHaveBeenCalledOnce();
});
