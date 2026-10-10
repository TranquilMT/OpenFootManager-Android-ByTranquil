import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import MatchLive from "./MatchLive";
import type { GameStateData } from "../../store/gameStore";
import type { MatchSnapshot } from "./types";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
vi.mock("../../utils/backendI18n", () => ({ resolveBackendError: () => "Decision rejected" }));
vi.mock("../../store/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: { match_speed: "slow", show_match_commentary: true },
    updateSettings: vi.fn(),
  }),
}));
vi.mock("./useSpokenCommentary", () => ({
  useSpokenCommentary: vi.fn(),
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
  phase: "FirstHalf",
  current_minute: 30,
  home_score: 0,
  away_score: 0,
  home_team: {
    id: "home",
    name: "Home FC",
    formation: "4-4-2",
    play_style: "Balanced",
    players: [],
  },
  away_team: {
    id: "away",
    name: "Away FC",
    formation: "4-4-2",
    play_style: "Balanced",
    players: [],
  },
  home_bench: [],
  away_bench: [],
  home_possession_pct: 50,
  away_possession_pct: 50,
  home_yellows: {},
  away_yellows: {},
  sent_off: [],
  substitutions: [],
  events: [],
  home_subs_made: 0,
  away_subs_made: 0,
  max_subs: 5,
} as unknown as MatchSnapshot;

describe("live match decisions", () => {
  beforeEach(() => vi.mocked(invoke).mockReset());
  it("shows a rejected tactical decision instead of silently logging it", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("rejected"));
    render(
      <MatchLive
        snapshot={snapshot}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "common.playStyles.Attacking" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Decision rejected");
  });
  it("sends a single live tempo instruction and applies the returned snapshot", async () => {
    const onSnapshotUpdate = vi.fn();
    vi.mocked(invoke).mockResolvedValueOnce(snapshot);
    render(
      <MatchLive
        snapshot={snapshot}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={onSnapshotUpdate}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /match.subs/ })[0]);
    fireEvent.click(screen.getByRole("combobox", { name: "tactics.phaseSettings.tempo" }));
    fireEvent.click(screen.getByRole("option", { name: "tactics.phaseSettings.tempo_Patient" }));
    await waitFor(() => expect(onSnapshotUpdate).toHaveBeenCalledWith(snapshot));
    expect(invoke).toHaveBeenLastCalledWith("apply_match_command", {
      command: { ChangeTacticalInstruction: { side: "Home", instruction: { Tempo: "Patient" } } },
    });
  });
  it("opens engine-backed tactical instructions directly from the match header", () => {
    render(
      <MatchLive
        snapshot={snapshot}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "dashboard.tactics" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "tactics.phaseSettings.tempo" }),
    ).toBeInTheDocument();
  });
  it("disables simulation and tactical controls after full time", () => {
    render(
      <MatchLive
        snapshot={{ ...snapshot, phase: "Finished" }}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "match.fast" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "4-4-2" })).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "common.playStyles.Attacking" })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", { name: /^match.subs(?: \(|$)/ })) {
      expect(button).toBeDisabled();
    }
  });
  it("suspends automatic steps while backgrounded and resumes at the selected speed", async () => {
    vi.useFakeTimers();
    const old = Object.getOwnPropertyDescriptor(document, "hidden");
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    vi.mocked(invoke).mockResolvedValue([]);
    const view = render(
      <MatchLive
        snapshot={snapshot}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });
      expect(invoke).not.toHaveBeenCalled();
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(invoke).toHaveBeenCalledExactlyOnceWith("step_live_match", { minutes: 1 });
    } finally {
      view.unmount();
      if (old) Object.defineProperty(document, "hidden", old);
      else Reflect.deleteProperty(document, "hidden");
      vi.useRealTimers();
    }
  });
  it("provides keyboard-selectable event tabs and selected speed state", () => {
    render(
      <MatchLive
        snapshot={snapshot}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    const events = screen.getByRole("tab", { name: "match.events" });
    expect(events).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(events, { key: "ArrowRight" });
    const stats = screen.getByRole("tab", { name: "match.stats" });
    expect(stats).toHaveAttribute("aria-selected", "true");
    expect(stats).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", stats.id);
    expect(screen.getByRole("button", { name: "match.slow" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.keyDown(stats, { key: "End" });
    expect(screen.getByRole("tab", { name: "match.player match.stats" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("keeps the all-events view consistent with its filter count", () => {
    const shot = {
      minute: 30,
      event_type: "ShotOffTarget",
      side: "Home" as const,
      player_id: null,
      secondary_player_id: null,
      zone: "Midfield",
    };
    render(
      <MatchLive
        snapshot={{ ...snapshot, events: [shot] }}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "common.all (1)" })).toBeInTheDocument();
    expect(screen.getByText("match.viewDetails")).toBeInTheDocument();
  });

  it("opens the recorded player statistics panel through its live match tab", () => {
    render(
      <MatchLive
        snapshot={snapshot}
        gameState={{ teams: [], players: [] } as unknown as GameStateData}
        userSide="Home"
        isSpectator={false}
        importantEvents={[]}
        onSnapshotUpdate={vi.fn()}
        onImportantEvent={vi.fn()}
        onHalfTime={vi.fn()}
        onFullTime={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "match.player match.stats" }));
    expect(screen.getByRole("table", { name: "Home FC" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "match-tab-players");
  });
  it("closes header and sidebar tactical shortcuts during shootouts", () => {
    render(<MatchLive snapshot={{ ...snapshot, phase: "PenaltyShootout" }}
      gameState={{ teams: [], players: [] } as unknown as GameStateData}
      userSide="Home" isSpectator={false} importantEvents={[]}
      onSnapshotUpdate={vi.fn()} onImportantEvent={vi.fn()}
      onHalfTime={vi.fn()} onFullTime={vi.fn()} />);
    expect(screen.getByRole("button", { name: "4-4-2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "dashboard.tactics" })).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "common.playStyles.Attacking" })) {
      expect(button).toBeDisabled();
    }
  });
  it("drops a queued tactical command if the match closes before execution", async () => {
    const props = { gameState: { teams: [], players: [] } as unknown as GameStateData,
      userSide: "Home" as const, isSpectator: false, importantEvents: [],
      onSnapshotUpdate: vi.fn(), onImportantEvent: vi.fn(), onHalfTime: vi.fn(), onFullTime: vi.fn() };
    const view = render(<MatchLive {...props} snapshot={snapshot} />);
    fireEvent.click(screen.getAllByRole("button", { name: "common.playStyles.Attacking" })[0]);
    view.rerender(<MatchLive {...props} snapshot={{ ...snapshot, phase: "Finished" }} />);
    await act(async () => {});
    expect(invoke).not.toHaveBeenCalled();
  });
});
