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

it("plays, pauses and steps through the recorded outcome", () => {
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.play" }));
  expect(screen.getByRole("button", { name: "match.pause" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "match.pause" }));
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.next" }));
  expect(screen.getByText("match.eventTypes.Goal")).toBeInTheDocument();
  expect(screen.getByText("1 – 0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "match.highlights.next" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.previous" }));
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
});

it("seeks directly to an action and pauses continuous playback", () => {
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.play" }));
  fireEvent.change(screen.getByRole("slider", { name: "match.events" }), {
    target: { value: "1" },
  });
  expect(screen.getByText("match.eventTypes.Goal")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "match.highlights.play" })).toBeInTheDocument();
  expect(screen.getByText("2 / 2")).toBeInTheDocument();
});
