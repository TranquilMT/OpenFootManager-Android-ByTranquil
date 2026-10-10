import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlayerMatchPerformance } from "./PlayerMatchPerformance";
import type { MatchSnapshot } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
describe("live player performance panel", () => {
  it("shows recorded player totals in labelled team tables", () => {
    const snapshot = {
      phase: "FirstHalf",
      current_minute: 30,
      home_team: { name: "Home", players: [{ id: "p", name: "Scorer" }] },
      away_team: { name: "Away", players: [] },
      home_bench: [],
      away_bench: [],
      substitutions: [],
      sent_off: [],
      events: [
        { event_type: "Goal", side: "Home", minute: 20, player_id: "p", secondary_player_id: null },
      ],
    } as unknown as MatchSnapshot;
    render(<PlayerMatchPerformance snapshot={snapshot} playerJerseyMap={new Map([["p", 9]])} />);
    const table = screen.getByRole("table", { name: "Home" });
    const row = within(table).getByText("Scorer (#9)").closest("tr");
    if (!row) throw new Error("No player row");
    expect(within(row).getByRole("rowheader", { name: "Scorer (#9)" })).toHaveAttribute(
      "scope",
      "row",
    );
    expect(
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["30", "1", "0", "1", "1", "0", "0", "0", "0", "0", "0"]);
  });
});
