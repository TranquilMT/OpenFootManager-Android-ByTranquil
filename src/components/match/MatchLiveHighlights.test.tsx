import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import MatchLive from "./MatchLive";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
import type { GameStateData } from "../../store/gameStore";
const invoke = vi.hoisted(() => vi.fn());
const speech = vi.hoisted(() => vi.fn());
vi.mock("../../utils/backendI18n", () => ({ resolveBackendError: () => "error" }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
vi.mock("../../store/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: { match_speed: "slow", show_match_commentary: true, spoken_match_commentary: true },
    updateSettings: vi.fn(),
  }),
}));
vi.mock("./useSpokenCommentary", () => ({
  useSpokenCommentary: speech,
  spokenCommentaryAvailable: () => false,
  cancelSpokenCommentary: vi.fn(),
}));
vi.mock("./MatchScreenLayout", () => ({
  default: ({ children, header }: { children: React.ReactNode; header: React.ReactNode }) => (
    <>
      {header}
      {children}
    </>
  ),
}));
const snapshot = {
  ...createSnapshot(),
  phase: "FirstHalf",
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
function setup() {
  invoke.mockReset();
  invoke.mockResolvedValue(snapshot);
  render(
    <MatchLive
      snapshot={snapshot}
      gameState={{ teams: [], players: [] } as unknown as GameStateData}
      userSide="Home"
      isSpectator={false}
      importantEvents={snapshot.events}
      onSnapshotUpdate={vi.fn()}
      onImportantEvent={vi.fn()}
      onHalfTime={vi.fn()}
      onFullTime={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "match.highlights.title" }));
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
}
afterEach(() => {
  vi.useRealTimers();
});
it("holds live engine stepping while a historical replay is open", async () => {
  vi.useFakeTimers();
  setup();
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(invoke).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "common.close" }));
  await act(async () => {
    vi.advanceTimersByTime(2000);
  });
  expect(invoke).toHaveBeenCalledWith("step_live_match", expect.any(Object));
});
it("suspends live spoken commentary while a recorded replay is being reviewed", () => {
  setup();
  expect(speech.mock.calls.at(-1)?.[4]).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "common.close" }));
  expect(speech.mock.calls.at(-1)?.[4]).toBe(true);
});
