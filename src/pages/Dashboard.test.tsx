import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createGameState } from "./dashboardTestFixture";
import type { LeagueData, SeasonContextData } from "../store/types";
import { applyExtraTranslations } from "../lib/extraTranslations";
import Dashboard from "./Dashboard";

const { listenMock, registeredEventHandlers } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();

  return {
    listenMock: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(event, handler);
      return Promise.resolve(vi.fn());
    }),
    registeredEventHandlers: handlers,
  };
});

const navigateMock = vi.fn();
const invokeMock = vi.fn();
const setGameStateMock = vi.fn();
const clearGameMock = vi.fn();
const markCleanMock = vi.fn();
const loadSettingsMock = vi.fn();

let gameState = createGameState();
let autoSaveEnabled = false;

vi.mock("../lib/extraTranslations", () => ({
  applyExtraTranslations: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    onCloseRequested: vi.fn(() => Promise.resolve(() => {})),
    destroy: vi.fn(),
  }),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: listenMock,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "dashboard.home": "Home",
        "dashboard.inbox": "Inbox",
        "dashboard.loading": "Loading",
        "dashboard.managers": "Managers",
        "dashboard.hallOfFame": "Hall of Fame",
        "continueMenu.goToField": "Go To Field",
        "continueMenu.goToFieldDesc": "desc",
        "continueMenu.watchSpectator": "Watch",
        "continueMenu.watchSpectatorDesc": "desc",
        "continueMenu.delegateAssistant": "Delegate",
        "continueMenu.delegateAssistantDesc": "desc",
      };

      return labels[key] ?? key;
    },
  }),
}));

vi.mock("../utils/backendI18n", () => ({
  resolveBackendText: (_key: string | undefined, fallback: string) => fallback ?? "",
}));

vi.mock("../store/gameStore", () => ({
  useGameStore: () => ({
    hasActiveGame: true,
    managerName: "Jane Doe",
    gameState,
    setGameState: setGameStateMock,
    clearGame: clearGameMock,
    isDirty: false,
    markClean: markCleanMock,
  }),
}));

vi.mock("../store/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: {
      language: "en",
      default_match_mode: "live",
      auto_save: autoSaveEnabled,
    },
    loaded: true,
    loadSettings: loadSettingsMock,
  }),
}));

vi.mock("../hooks/useAdvanceTime", () => ({
  useAdvanceTime: () => ({
    isAdvancing: false,
    showContinueMenu: false,
    setShowContinueMenu: vi.fn(),
    showMatchConfirm: false,
    setShowMatchConfirm: vi.fn(),
    matchMode: "live",
    setMatchMode: vi.fn(),
    blockerModal: null,
    setBlockerModal: vi.fn(),
    handleContinue: vi.fn(),
    handleConfirmMatch: vi.fn(),
    handleSkipToMatchDay: vi.fn(),
  }),
}));

vi.mock("../components/dashboard/DashboardSidebar", () => ({
  default: ({
    onNavClick,
    activeTab,
  }: {
    onNavClick: (tab: string) => void;
    activeTab: string;
  }) => (
    <div>
      <span>Sidebar {activeTab}</span>
      <button type="button" onClick={() => onNavClick("Inbox")}>
        nav-inbox
      </button>
      <button type="button" onClick={() => onNavClick("Managers")}>
        nav-managers
      </button>
    </div>
  ),
}));

vi.mock("../components/dashboard/DashboardHeader", () => ({
  default: ({
    activeTabLabel,
    onBack,
    onSelectSearchPlayer,
    onSelectSearchTeam,
  }: {
    activeTabLabel: string;
    onBack: () => void;
    onSelectSearchPlayer: (playerId: string) => void;
    onSelectSearchTeam: (teamId: string) => void;
  }) => (
    <div>
      <span>Header {activeTabLabel}</span>
      <button type="button" onClick={onBack}>
        header-back
      </button>
      <button type="button" onClick={() => onSelectSearchPlayer("player-1")}>
        search-player
      </button>
      <button type="button" onClick={() => onSelectSearchTeam("team-2")}>
        search-team
      </button>
    </div>
  ),
}));

vi.mock("../components/playerProfile/PlayerProfile", () => ({
  default: ({
    onClose,
    onSelectTeam,
  }: {
    onClose: () => void;
    onSelectTeam: (teamId: string) => void;
  }) => (
    <div>
      <span>Player Profile Mock</span>
      <button type="button" onClick={onClose}>
        player-close
      </button>
      <button type="button" onClick={() => onSelectTeam("team-2")}>
        player-select-team
      </button>
    </div>
  ),
}));

vi.mock("../components/teamProfile", () => ({
  default: ({
    onClose,
    onSelectPlayer,
  }: {
    onClose: () => void;
    onSelectPlayer: (playerId: string) => void;
  }) => (
    <div>
      <span>Team Profile Mock</span>
      <button type="button" onClick={onClose}>
        team-close
      </button>
      <button type="button" onClick={() => onSelectPlayer("player-1")}>
        team-select-player
      </button>
    </div>
  ),
}));

vi.mock("../components/dashboard/DashboardAlerts", () => ({
  default: () => <div>Alerts Mock</div>,
}));

vi.mock("../components/dashboard/DashboardTabContent", () => ({
  default: ({ viewModel }: { viewModel: { activeTab: string; seasonComplete: boolean } }) => (
    <div>
      <div>Tab Content {viewModel.activeTab}</div>
      {viewModel.seasonComplete ? <div>season over</div> : null}
    </div>
  ),
}));

vi.mock("../components/dashboard/DashboardBlockerModal", () => ({
  default: () => null,
}));

vi.mock("../components/dashboard/DashboardCloseConfirmModal", () => ({
  default: () => null,
}));

vi.mock("../components/dashboard/DashboardExitConfirmModal", () => ({
  default: () => null,
}));

vi.mock("../components/dashboard/DashboardExitSavingModal", () => ({
  default: () => null,
}));

vi.mock("../components/dashboard/DashboardMatchConfirmModal", () => ({
  default: () => null,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    gameState = createGameState();
    autoSaveEnabled = false;
    registeredEventHandlers.clear();
    listenMock.mockClear();
    invokeMock.mockReset();
    setGameStateMock.mockReset();
    clearGameMock.mockReset();
    markCleanMock.mockReset();
    loadSettingsMock.mockReset();
    navigateMock.mockReset();
    vi.mocked(applyExtraTranslations).mockReset();
    window.localStorage.clear();
    gameState.competitions = undefined;
    gameState.season_context = undefined;
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "get_active_game") {
        return gameState;
      }

      return null;
    });
  });

  // A finished league that is not the player's own, sorting first in the array.
  // Competitions are ordered by country code, so in a generated world this is
  // always Argentina — a split-season country on a different calendar.
  function foreignLeagueStillPlaying(): LeagueData {
    return {
      id: "ar-d1-apertura",
      name: "ar-d1-apertura",
      season: 2035,
      kind: "League",
      scope: "Domestic",
      country_id: "AR",
      priority: 0,
      participant_ids: ["ar-00", "ar-01"],
      rules: { format: "LeagueTable", counts_in_season_flow: true },
      fixtures: [
        {
          id: "ar-1",
          matchday: 1,
          date: "2036-02-10",
          home_team_id: "ar-00",
          away_team_id: "ar-01",
          competition: "League",
          status: "Completed",
          result: null,
        },
        {
          id: "ar-2",
          matchday: 2,
          date: "2036-10-10",
          home_team_id: "ar-01",
          away_team_id: "ar-00",
          competition: "League",
          status: "Scheduled",
          result: null,
        },
      ],
      standings: [],
    } as LeagueData;
  }

  function seasonContext(seasonComplete: boolean): SeasonContextData {
    return {
      phase: seasonComplete ? "PostSeason" : "InSeason",
      season_complete: seasonComplete,
      season_start: null,
      season_end: null,
      days_until_season_start: null,
      transfer_window: {
        status: "Closed",
        opens_on: null,
        closes_on: null,
        days_until_opens: null,
        days_remaining: null,
      },
    } as SeasonContextData;
  }

  /// The end-of-season screen is the only way to roll the season over, and the
  /// rollover is what runs promotion and relegation. This used to be decided
  /// from `competitions[0]` — never the player's league — so an English career
  /// that finished in April waited on an Argentine Apertura running to October,
  /// the screen never appeared, and the player could not continue.
  it("offers the end of season from the backend flag, not the first competition", async () => {
    gameState.competitions = [foreignLeagueStillPlaying()];
    gameState.season_context = seasonContext(true);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("season over")).toBeInTheDocument();
    });
  });

  it("keeps the season running while the backend says it is not over", async () => {
    // The first competition has finished every fixture, which is exactly what
    // the old local rule keyed on. The backend says otherwise.
    const finished = foreignLeagueStillPlaying();
    finished.fixtures = finished.fixtures.map((fixture) => ({
      ...fixture,
      status: "Completed",
    }));
    gameState.competitions = [finished];
    gameState.season_context = seasonContext(false);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Tab Content Home")).toBeInTheDocument();
    });
    expect(screen.queryByText("season over")).not.toBeInTheDocument();
  });

  it("supports search selection, profile switching, back-navigation, and tab switching", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Tab Content Home")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("search-player"));
    expect(screen.getByText("Player Profile Mock")).toBeInTheDocument();

    fireEvent.click(screen.getByText("player-select-team"));
    expect(screen.getByText("Team Profile Mock")).toBeInTheDocument();

    fireEvent.click(screen.getByText("header-back"));
    expect(screen.getByText("Player Profile Mock")).toBeInTheDocument();

    fireEvent.click(screen.getByText("header-back"));
    expect(screen.getByText("Tab Content Home")).toBeInTheDocument();

    fireEvent.click(screen.getByText("nav-inbox"));
    expect(screen.getByText("Tab Content Inbox")).toBeInTheDocument();

    fireEvent.click(screen.getByText("nav-managers"));
    expect(screen.getByText("Header Managers")).toBeInTheDocument();
  });

  it("loads game state when the active save id fetch fails", async () => {
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "get_active_game") {
        return gameState;
      }

      if (command === "get_active_save_id") {
        throw new Error("save id unavailable");
      }

      return null;
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(setGameStateMock).toHaveBeenCalledWith(gameState);
    });
    expect(applyExtraTranslations).toHaveBeenCalledWith(gameState.extra_translations);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(clearGameMock).not.toHaveBeenCalled();
  });

  it("clears a stale active save id when a later refresh cannot load it", async () => {
    const saveStorageKey = "ofm-onboarding-visited-tabs:save:save-1";
    const legacyStorageKey = `ofm-onboarding-visited-tabs:legacy:${gameState.manager.id}:${gameState.clock.start_date}`;
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    let saveIdRequestCount = 0;

    invokeMock.mockImplementation(async (command: string) => {
      if (command === "get_active_game") {
        return gameState;
      }

      if (command === "get_active_save_id") {
        saveIdRequestCount += 1;
        if (saveIdRequestCount === 1) {
          return "save-1";
        }

        throw new Error("save id unavailable");
      }

      return null;
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(getItemSpy).toHaveBeenCalledWith(saveStorageKey);
    });

    getItemSpy.mockClear();
    const gameStateChangedHandler = registeredEventHandlers.get("game-state-changed");
    expect(gameStateChangedHandler).toBeTypeOf("function");

    await gameStateChangedHandler?.();

    await waitFor(() => {
      expect(getItemSpy).toHaveBeenCalledWith(legacyStorageKey);
    });

    getItemSpy.mockRestore();
  });
  it.each([true, false])(
    "only clears dirty state for the exact saved revision (later change: %s)",
    async (changeWhileSaving) => {
      autoSaveEnabled = true;
      let finishSave: (() => void) | undefined;
      invokeMock.mockImplementation((command: string) => {
        if (command === "get_active_game") return Promise.resolve(gameState);
        if (command === "get_active_save_id") return Promise.resolve("save-1");
        if (command === "save_game")
          return new Promise<void>((resolve) => {
            finishSave = resolve;
          });
        return Promise.resolve(null);
      });
      const view = render(<Dashboard />);
      await waitFor(() => expect(setGameStateMock).toHaveBeenCalledWith(gameState));
      gameState = {
        ...gameState,
        clock: { ...gameState.clock, current_date: "2026-07-11T12:00:00Z" },
      };
      view.rerender(<Dashboard />);
      await waitFor(() => expect(finishSave).toBeTypeOf("function"));
      if (changeWhileSaving) {
        gameState = { ...gameState, messages: [] };
        view.rerender(<Dashboard />);
      }
      finishSave?.();
      await waitFor(() => expect(invokeMock).toHaveBeenCalledWith("save_game"));
      await Promise.resolve();
      expect(markCleanMock).toHaveBeenCalledTimes(changeWhileSaving ? 0 : 1);
    },
  );
});
