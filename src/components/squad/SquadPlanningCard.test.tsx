import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createGameState } from "../../pages/dashboardTestFixture";
import SquadPlanningCard from "./SquadPlanningCard";
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
describe("squad planning loan returns", () => {
  it("shows incoming loan departures and opens the player profile without renewal", () => {
    const base = createGameState().players[0];
    const player = {
      ...base,
      contract_end: "2028-01-01",
      active_loan: {
        parent_team_id: "parent",
        loan_team_id: base.team_id!,
        start_date: "2026-07-01",
        end_date: "2026-09-01",
        wage_contribution_pct: 100,
      },
    };
    const select = vi.fn();
    render(
      <SquadPlanningCard
        players={[player]}
        formation="4-4-2"
        today="2026-07-10"
        onSelectPlayer={select}
      />,
    );
    expect(screen.getByText("phase73.loanReturns")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "squad.viewProfile" }));
    expect(select).toHaveBeenCalledWith(player.id);
    expect(screen.queryByRole("button", { name: "common.renewContract" })).not.toBeInTheDocument();
  });
});
