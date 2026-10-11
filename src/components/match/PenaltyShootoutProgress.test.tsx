import { useCallback, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import PenaltyShootoutScreen from "./PenaltyShootoutScreen";
import type { MatchSnapshot, MinuteResult } from "./types";
import type { GameStateData } from "../../store/gameStore";
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const initial = {
  phase: "PenaltyShootout",
  current_minute: 120,
  home_team: { id: "h", name: "Home", players: [] },
  away_team: { id: "a", name: "Away", players: [] },
  home_set_pieces: {},
  away_set_pieces: {},
  sent_off: [],
  events: [],
  penalty_shootout: {
    home_taken: 0,
    away_taken: 0,
    home_scored: 0,
    away_scored: 0,
    sudden_death: false,
  },
} as unknown as MatchSnapshot;
const game = { teams: [] } as unknown as GameStateData;
const result = { minute: 120, events: [], is_finished: false } as unknown as MinuteResult;
function Harness({ finished, spectator = true }: { finished: () => void; spectator?: boolean }) {
  const [snapshot, setSnapshot] = useState(initial);
  const important = useCallback(() => {}, []);
  return (
    <PenaltyShootoutScreen
      snapshot={snapshot}
      gameState={game}
      userSide={spectator ? null : "Home"}
      isSpectator={spectator}
      importantEvents={[]}
      onSnapshotUpdate={setSnapshot}
      onImportantEvent={important}
      onFullTime={finished}
    />
  );
}
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
describe("shootout progression", () => {
  it("keeps stepping when kick counts change at the same minute", async () => {
    vi.useFakeTimers();
    let kicks = 0;
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "step_live_match") {
        kicks++;
        return [result];
      }
      return {
        ...initial,
        penalty_shootout: {
          ...initial.penalty_shootout,
          home_taken: Math.ceil(kicks / 2),
          away_taken: Math.floor(kicks / 2),
        },
      };
    });
    render(<Harness finished={vi.fn()} />);
    for (let n = 0; n < 3; n++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });
    expect(kicks).toBe(3);
  });
  it("starts managed shootouts paused so the taker order can be reviewed", async () => {
    vi.useFakeTimers();
    render(<Harness spectator={false} finished={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "match.live" })).toBeInTheDocument();
  });
  it("does not overlap pending manual kicks", async () => {
    let resolve: (value: MinuteResult[]) => void = () => {};
    vi.mocked(invoke).mockImplementation((command) =>
      command === "step_live_match"
        ? new Promise<MinuteResult[]>((done) => {
            resolve = done;
          })
        : Promise.resolve(initial),
    );
    render(<Harness spectator={false} finished={vi.fn()} />);
    const step = screen.getByRole("button", { name: "match.step1Min" });
    fireEvent.click(step);
    fireEvent.click(step);
    expect(invoke).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve([result]);
    });
  });
  it("cancels delayed full-time navigation when unmounted", async () => {
    vi.useFakeTimers();
    const finished = vi.fn();
    vi.mocked(invoke).mockImplementation(async (command) =>
      command === "step_live_match"
        ? [{ ...result, is_finished: true }]
        : { ...initial, phase: "Finished" },
    );
    const view = render(<Harness finished={finished} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(finished).not.toHaveBeenCalled();
  });
});
