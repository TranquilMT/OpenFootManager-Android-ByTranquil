import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
});
