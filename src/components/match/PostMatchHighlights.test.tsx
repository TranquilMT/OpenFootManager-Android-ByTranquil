import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import PostMatchScreen from "./PostMatchScreen";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { GameStateData } from "../../store/gameStore";
import type { MatchEvent } from "./types";
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../ui")>()),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TeamLogo: () => null,
  ThemeToggle: () => null,
}));
vi.mock("./PostMatchCharts", () => ({ PossessionDonut: () => null }));
it("reviews completed-match highlights without sending any engine command", () => {
  const goal = {
    event_type: "Goal",
    minute: 20,
    side: "Home",
    zone: "AwayBox",
    player_id: "starter-1",
    secondary_player_id: null,
  } as MatchEvent;
  render(
    <PostMatchScreen
      snapshot={{ ...createSnapshot(), phase: "Finished", current_minute: 90, events: [goal] }}
      gameState={{ teams: [] } as unknown as GameStateData}
      userSide={null}
      isSpectator
      importantEvents={[goal]}
      onContinue={vi.fn()}
      onFinish={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "match.highlights.title" }));
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
