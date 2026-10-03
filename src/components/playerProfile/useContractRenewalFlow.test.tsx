import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { createGameState } from "../../pages/dashboardTestFixture";
import { createPlayer } from "../../test-utils/factories";
import { useContractRenewalFlow } from "./useContractRenewalFlow";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("../../utils/backendI18n", () => ({ resolveBackendText: (text: string) => text }));
vi.mock("../../utils/errorMessage", () => ({
  resolveTranslatedErrorMessage: (text: string) => text,
}));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
beforeEach(() => vi.mocked(invoke).mockReset());
it("opens a 5.2m annual contract at 100k per week", () => {
  const player = createPlayer({ wage: 5_200_000 });
  const gameState = createGameState();
  gameState.players = [player];
  vi.mocked(invoke).mockResolvedValue({ projection: null });
  const { result } = renderHook(() =>
    useContractRenewalFlow({ player, gameState, hasAssistantManager: false }),
  );
  act(() => result.current.openRenewalModal());
  expect(result.current.renewalWage).toBe("100000");
  expect(invoke).toHaveBeenCalledWith("preview_renewal_financial_impact", {
    playerId: player.id,
    weeklyWage: 100000,
  });
});
