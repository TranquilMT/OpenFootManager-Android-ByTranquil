import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BoardRoomPanel from "./BoardRoomPanel";
import { getBoardRoom, negotiateManagerContract } from "../../services/boardRoomService";
import type { GameStateData } from "../../store/gameStore";
vi.mock("../../services/boardRoomService", () => ({ getBoardRoom: vi.fn(), negotiateManagerContract: vi.fn(), requestBoardInvestment: vi.fn() }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
const game = { manager: { id: "manager", team_id: "club", satisfaction: 70 }, clock: { current_date: "2026-08-02" }, players: [], teams: [{ id: "club", name: "Club" }], league: { season: 1, standings: [1,2,3,4] } } as unknown as GameStateData;
const room = { manager_id: "manager", joined_season: 1, baseline_target: 2, style_matches: 0, ownership_generation: 0, takeover_due: null, last_negotiation_date: "", last_investment_season: 0, contract: { weekly_salary: 1000, end_date: "2028-08-01", league_target: 2, youth_minutes_target: 200, style: "Balanced" } };
describe("BoardRoomPanel", () => {
  it("submits the manager's proposed terms", async () => {
    vi.mocked(getBoardRoom).mockResolvedValue(room);
    vi.mocked(negotiateManagerContract).mockResolvedValue(game);
    render(<BoardRoomPanel gameState={game} />);
    await screen.findByLabelText("phase6.salary");
    fireEvent.change(screen.getByLabelText("phase6.salary"), { target: { value: "1200" } });
    fireEvent.click(screen.getByRole("button", { name: "phase6.negotiate" }));
    await waitFor(() => expect(negotiateManagerContract).toHaveBeenCalledWith(1200, 2, 2));
  });
  it("shows a readable message when the board is unavailable", async () => {
    vi.mocked(getBoardRoom).mockRejectedValue(new Error("backend details"));
    render(<BoardRoomPanel gameState={game} />);
    expect(await screen.findByRole("status")).toHaveTextContent("phase6.unavailable");
  });
});
