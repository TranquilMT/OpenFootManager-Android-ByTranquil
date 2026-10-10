import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubPanel } from "./SubPanel";
import { buildRecommendedSubstitutions, getAvailableMatchBench } from "./SubPanel.helpers";
import type { EnginePlayerData, EngineTeamData, MatchSnapshot } from "./types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, arg?: unknown) => {
      if (typeof arg === "string") {
        return arg;
      }

      if (typeof arg === "object" && arg !== null && "used" in arg && "max" in arg) {
        return `${key}:${String((arg as { used: number }).used)}/${String((arg as { max: number }).max)}`;
      }

      if (key === "common.cancel") {
        return "Cancel";
      }

      if (key === "match.selectToTakeOff") {
        return "Select to take off";
      }

      if (key === "match.clearReplacementSelection") {
        return "Clear replacement";
      }

      if (key === "match.selectReplacementMenu") {
        return "Select replacement";
      }

      if (key === "match.selectPlayerToTakeOffFirst") {
        return "Select player to take off first";
      }

      if (key === "match.confirmSubstitution") {
        return "Confirm substitution";
      }

      return key;
    },
  }),
}));

const makePlayer = (overrides: Partial<EnginePlayerData> = {}): EnginePlayerData => {
  const { ovr = 70, ...rest } = overrides;

  return {
    id: "player-1",
    name: "Player One",
    position: "Midfielder",
    ovr,
    condition: 78,
    pace: 70,
    stamina: 70,
    strength: 70,
    agility: 70,
    passing: 70,
    shooting: 70,
    tackling: 70,
    dribbling: 70,
    defending: 70,
    positioning: 70,
    vision: 70,
    decisions: 70,
    composure: 70,
    aggression: 60,
    teamwork: 70,
    leadership: 60,
    handling: 20,
    reflexes: 20,
    aerial: 60,
    traits: [],
    role: "Standard",
    ...rest,
  };
};

const makeTeam = (overrides: Partial<EngineTeamData> = {}): EngineTeamData => ({
  id: "team-1",
  name: "Alpha FC",
  formation: "4-4-2",
  play_style: "Balanced",
  players: [
    makePlayer({ id: "starter-1", name: "Starter One", position: "Midfielder" }),
    makePlayer({ id: "starter-2", name: "Starter Two", position: "Forward", shooting: 80 }),
  ],
  ...overrides,
});

function createSnapshot(): MatchSnapshot {
  return {
    phase: "first_half",
    current_minute: 32,
    home_score: 1,
    away_score: 0,
    possession: "Home",
    ball_zone: "MiddleThird",
    home_team: makeTeam(),
    away_team: makeTeam({
      id: "team-2",
      name: "Beta FC",
      players: [makePlayer({ id: "opp-1", name: "Opponent One" })],
    }),
    home_bench: [
      makePlayer({ id: "bench-1", name: "Bench One", position: "Midfielder", condition: 92 }),
      makePlayer({ id: "bench-2", name: "Bench Two", position: "Forward", shooting: 76 }),
    ],
    away_bench: [makePlayer({ id: "opp-bench-1", name: "Opponent Bench" })],
    home_possession_pct: 56,
    away_possession_pct: 44,
    events: [],
    home_subs_made: 0,
    away_subs_made: 0,
    max_subs: 5,
    home_set_pieces: {
      free_kick_taker: null,
      corner_taker: null,
      penalty_taker: null,
      captain: null,
    },
    away_set_pieces: {
      free_kick_taker: null,
      corner_taker: null,
      penalty_taker: null,
      captain: null,
    },
    substitutions: [],
    allows_extra_time: false,
    home_yellows: {},
    away_yellows: {},
    sent_off: [],
  };
}

describe("SubPanel", () => {
  it("preselects the injured player supplied by an actionable alert", () => {
    render(
      <SubPanel
        snapshot={createSnapshot()}
        side="Home"
        initialPlayerId="starter-2"
        onSubstitute={vi.fn()}
        onFormationChange={vi.fn()}
        onPlayStyleChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sub-panel-off-starter-2")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("sub-panel-off-starter-1")).toHaveAttribute("aria-pressed", "false");
  });
  const createProps = () => ({
    snapshot: createSnapshot(),
    side: "Home" as const,
    onSubstitute: vi.fn(),
    onFormationChange: vi.fn(),
    onPlayStyleChange: vi.fn(),
    onClose: vi.fn(),
  });

  it("names the decision dialog and supports Escape with focus restoration", () => {
    const props = createProps();
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const view = render(<SubPanel {...props} />);
    const dialog = screen.getByRole("dialog", { name: "match.substitutionsTitle" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "common.close" })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledOnce();
    view.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("keeps keyboard navigation inside the decision panel", () => {
    render(<SubPanel {...createProps()} />);
    const close = screen.getByRole("button", { name: "common.close" });
    close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(close).not.toHaveFocus();
    const focused = document.activeElement;
    if (!focused) throw new Error("Missing focused control");
    fireEvent.keyDown(focused, { key: "Tab" });
    expect(close).toHaveFocus();
  });

  it("shows a disabled bench context menu action until a player is selected to come off", () => {
    const props = createProps();

    render(<SubPanel {...props} />);

    fireEvent.contextMenu(screen.getByTestId("sub-panel-bench-bench-1"));

    expect(
      screen.getByRole("menuitem", { name: "Select player to take off first" }),
    ).toBeDisabled();
  });

  it("supports the substitution selection flow through context menus", () => {
    const props = createProps();

    render(<SubPanel {...props} />);

    fireEvent.contextMenu(screen.getByTestId("sub-panel-off-starter-1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Select to take off" }));

    fireEvent.contextMenu(screen.getByTestId("sub-panel-bench-bench-1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Select replacement" }));

    fireEvent.click(screen.getByRole("button", { name: "Confirm substitution" }));

    expect(props.onSubstitute).toHaveBeenCalledWith("starter-1", "bench-1");
  });

  it("allows clearing the selected off-player through the context menu", () => {
    const props = createProps();

    render(<SubPanel {...props} />);

    fireEvent.contextMenu(screen.getByTestId("sub-panel-off-starter-1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Select to take off" }));

    expect(screen.getByText("match.selectBenchToCompare")).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByTestId("sub-panel-off-starter-1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Cancel" }));

    expect(screen.queryByText("match.selectBenchToCompare")).not.toBeInTheDocument();
  });

  it("surfaces recommendations and applies the recommended play style", () => {
    const props = createProps();

    render(<SubPanel {...props} />);

    expect(screen.getByTestId("recommended-sub-starter-1-bench-1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("recommended-plan-cta"));

    expect(props.onPlayStyleChange).toHaveBeenCalledWith("Balanced");
  });

  it("never offers a dismissed bench player", () => {
    const props = createProps();
    props.snapshot.sent_off = ["bench-1"];
    render(<SubPanel {...props} />);
    expect(screen.queryByTestId("sub-panel-bench-bench-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recommended-sub-starter-1-bench-1")).not.toBeInTheDocument();
  });

  it("does not recommend swaps after the substitution allowance is exhausted", () => {
    const props = createProps();
    props.snapshot.home_subs_made = props.snapshot.max_subs;
    render(<SubPanel {...props} />);
    expect(screen.queryByTestId("recommended-sub-starter-1-bench-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("recommended-plan-cta"));
    expect(props.onPlayStyleChange).toHaveBeenCalledWith("Balanced");
  });

  it("applies formation from quick tactical tweaks", () => {
    const props = createProps();

    render(<SubPanel {...props} />);

    fireEvent.click(screen.getByRole("combobox", { name: "tactics.formation" }));
    fireEvent.click(screen.getByRole("option", { name: "4-3-3" }));

    expect(props.onFormationChange).toHaveBeenCalledWith("4-3-3");
  });

  it("lets a recommendation prefill the swap flow", () => {
    const props = createProps();

    render(<SubPanel {...props} />);

    fireEvent.click(screen.getByTestId("recommended-sub-starter-1-bench-1"));

    expect(screen.getAllByText("Starter One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bench One").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Confirm substitution" })).toBeInTheDocument();
  });

  it("invalidates a prepared swap when the selected replacement is dismissed", () => {
    const props = createProps();
    const view = render(<SubPanel {...props} />);
    fireEvent.click(screen.getByTestId("recommended-sub-starter-1-bench-1"));
    view.rerender(<SubPanel {...props} snapshot={{ ...props.snapshot, sent_off: ["bench-1"] }} />);
    const confirm = screen.queryByRole("button", { name: "Confirm substitution" });
    if (confirm) fireEvent.click(confirm);
    expect(props.onSubstitute).not.toHaveBeenCalled();
  });

  it("does not recommend using the reserve goalkeeper in an outfield role", () => {
    const props = createProps();
    props.snapshot.home_bench = [
      makePlayer({ id: "keeper", position: "Goalkeeper", ovr: 99, condition: 100 }),
    ];
    render(<SubPanel {...props} />);
    expect(screen.queryByTestId("recommended-sub-starter-1-keeper")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recommended-sub-starter-2-keeper")).not.toBeInTheDocument();
  });
  it("disables formation and style while another decision is pending", () => {
    render(<SubPanel {...createProps()} pending />);
    expect(screen.getByRole("combobox", { name: "tactics.formation" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "tactics.playStyle" })).toBeDisabled();
  });
  it("prefers a reserve goalkeeper to stronger outfield cover for a keeper change", () => {
    const snap = createSnapshot();
    snap.home_team.players = [makePlayer({ id: "keeper", position: "Goalkeeper", condition: 30 })];
    snap.home_bench = [
      makePlayer({ id: "forward", position: "Forward", ovr: 99, condition: 100 }),
      makePlayer({ id: "reserve-keeper", position: "Goalkeeper", ovr: 30, condition: 70 }),
    ];
    expect(buildRecommendedSubstitutions(snap, "Home")[0].onId).toBe("reserve-keeper");
  });
  it("excludes injured bench players from both picker and recommendations", () => {
    const snap = createSnapshot();
    snap.events = [
      {
        minute: 20,
        event_type: "Injury",
        side: "Home",
        player_id: "bench-1",
        secondary_player_id: null,
        zone: "Midfield",
      },
    ];
    expect(getAvailableMatchBench(snap, "Home").map((player) => player.id)).not.toContain(
      "bench-1",
    );
    expect(buildRecommendedSubstitutions(snap, "Home").map((rec) => rec.onId)).not.toContain(
      "bench-1",
    );
  });
  it("prioritises a recorded injury over routine fitness recommendations", () => {
    const snap = createSnapshot();
    snap.max_subs = 1;
    snap.home_team.players[0].condition = 10;
    snap.home_team.players[1].condition = 100;
    snap.events = [
      {
        minute: 31,
        event_type: "Injury",
        side: "Home",
        player_id: "starter-2",
        secondary_player_id: null,
        zone: "Midfield",
      },
    ];
    expect(buildRecommendedSubstitutions(snap, "Home")[0].offId).toBe("starter-2");
  });
  it("produces stable recommendations when equally suitable reserves change list order", () => {
    const snap = createSnapshot();
    snap.max_subs = 1;
    snap.home_team.players = [makePlayer({ id: "starter", condition: 20 })];
    snap.home_bench = [
      makePlayer({ id: "z-reserve", condition: 100 }),
      makePlayer({ id: "a-reserve", condition: 100 }),
    ];
    const before = buildRecommendedSubstitutions(snap, "Home");
    snap.home_bench.reverse();
    expect(buildRecommendedSubstitutions(snap, "Home")).toEqual(before);
  });

  it("offers injury cover even when the reserve is weaker and has another role", () => {
    const snap = createSnapshot();
    snap.home_team.players = [
      makePlayer({ id: "injured", position: "Midfielder", condition: 100, ovr: 90 }),
    ];
    snap.home_bench = [makePlayer({ id: "cover", position: "Defender", condition: 80, ovr: 50 })];
    snap.events = [
      {
        minute: 30,
        event_type: "Injury",
        side: "Home",
        zone: "Midfield",
        player_id: "injured",
        secondary_player_id: null,
      },
    ];
    expect(buildRecommendedSubstitutions(snap, "Home")[0]).toMatchObject({
      offId: "injured",
      onId: "cover",
    });
  });

  it("does not recommend substitutions once a penalty shootout has started", () => {
    const snap = createSnapshot();
    snap.phase = "PenaltyShootout";
    expect(buildRecommendedSubstitutions(snap, "Home")).toEqual([]);
  });

  it("disables the recommended tactical plan during a pending command", () => {
    render(<SubPanel {...createProps()} pending />);
    expect(screen.getByTestId("recommended-plan-cta")).toBeDisabled();
  });

  it("locks recommendation chips during a pending command", () => {
    render(<SubPanel {...createProps()} pending />);
    const chips = screen.getAllByTestId(/^recommended-sub-/);
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) expect(chip).toBeDisabled();
  });

  it("explains recommendation reasons in the chip tooltip", () => {
    render(<SubPanel {...createProps()} />);
    expect(screen.getAllByTestId(/^recommended-sub-/)[0]).toHaveAttribute(
      "title",
      expect.stringContaining("match.subRecommendationReasons"),
    );
  });

  it("locks shared decision controls during a penalty shootout", () => {
    const props = createProps();
    props.snapshot.phase = "PenaltyShootout";
    render(<SubPanel {...props} />);
    expect(screen.getByRole("combobox", { name: "tactics.formation" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "tactics.playStyle" })).toBeDisabled();
    fireEvent.click(screen.getByTestId("sub-panel-off-starter-1"));
    expect(screen.getByTestId("sub-panel-off-starter-1")).toHaveAttribute("aria-pressed", "false");
  });

  it("explains injury replacements without inventing a fitness or quality gain", () => {
    const props = createProps();
    props.snapshot.home_team.players = [
      makePlayer({ id: "injured", position: "Midfielder", condition: 100, ovr: 90 }),
    ];
    props.snapshot.home_bench = [
      makePlayer({ id: "cover", position: "Defender", condition: 80, ovr: 50 }),
    ];
    props.snapshot.events = [
      {
        minute: 30,
        event_type: "Injury",
        side: "Home",
        zone: "Midfield",
        player_id: "injured",
        secondary_player_id: null,
      },
    ];
    render(<SubPanel {...props} />);
    expect(screen.getByTestId("recommended-sub-injured-cover")).toHaveAttribute(
      "title",
      "match.eventTypes.Injury",
    );
  });
});
