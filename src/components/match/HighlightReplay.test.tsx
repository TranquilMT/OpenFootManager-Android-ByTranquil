import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
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

it("focuses close, traps keyboard focus and restores the opener after disposal", () => {
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();
  const { unmount } = render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  const close = screen.getByRole("button", { name: "common.close" });
  expect(close).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
  expect(screen.getByRole("button", { name: "match.highlights.next" })).toHaveFocus();
  unmount();
  expect(opener).toHaveFocus();
  opener.remove();
});
it("closes the replay with Escape", () => {
  const close = vi.fn();
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={close} />);
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(close).toHaveBeenCalledOnce();
});
it("supports action navigation keys without overriding the native seek slider", () => {
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  const dialog = screen.getByRole("dialog");
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(screen.getByText("match.eventTypes.Goal")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "Home" });
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "End" });
  expect(screen.getByText("match.eventTypes.Goal")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
});

afterEach(() => vi.useRealTimers());
it("lets the viewer slow down recorded actions independently of match speed", () => {
  vi.useFakeTimers();
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "match.slow" }));
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.play" }));
  act(() => {
    vi.advanceTimersByTime(900);
  });
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(screen.getByText("match.eventTypes.Goal")).toBeInTheDocument();
});

it("identifies both clubs around the historical replay score", () => {
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  expect(screen.getByLabelText("common.score")).toHaveTextContent("Alpha FC");
  expect(screen.getByLabelText("common.score")).toHaveTextContent("Beta FC");
});

it("keeps a closeable dialog when the selected recording has no actions", () => {
  const close = vi.fn();
  render(<HighlightReplay clip={{ ...clip, events: [] }} snapshot={snapshot} onClose={close} />);
  expect(screen.getByRole("dialog")).toHaveTextContent("match.highlights.unavailable");
  fireEvent.click(screen.getByRole("button", { name: "common.close" }));
  expect(close).toHaveBeenCalledOnce();
});

it("provides distinct playlist controls while keeping action controls separate", () => {
  const previous = vi.fn(),
    next = vi.fn();
  render(
    <HighlightReplay
      clip={clip}
      snapshot={snapshot}
      onClose={vi.fn()}
      onPreviousClip={previous}
      onNextClip={next}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.previousClip" }));
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.nextClip" }));
  expect(previous).toHaveBeenCalledOnce();
  expect(next).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "match.highlights.next" })).toBeInTheDocument();
});

it("advances the playlist only after the viewer enables automatic next", () => {
  vi.useFakeTimers();
  const next = vi.fn();
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} onNextClip={next} />);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.next" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(next).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox", { name: "match.highlights.autoNext" }));
  act(() => vi.advanceTimersByTime(1500));
  expect(next).toHaveBeenCalledOnce();
});

it("holds the selected clip when the system requests reduced motion", () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const next = vi.fn();
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} onNextClip={next} />);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.next" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "match.highlights.autoNext" }));
  act(() => vi.advanceTimersByTime(2000));
  expect(next).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it("toggles playback with Space without hijacking native control keys", () => {
  render(<HighlightReplay clip={clip} snapshot={snapshot} onClose={vi.fn()} />);
  fireEvent.keyDown(screen.getByRole("dialog"), { key: " " });
  expect(screen.getByRole("button", { name: "match.pause" })).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("slider"), { key: " " });
  expect(screen.getByRole("button", { name: "match.pause" })).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: " " });
  expect(screen.getByRole("button", { name: "match.highlights.play" })).toBeInTheDocument();
});
