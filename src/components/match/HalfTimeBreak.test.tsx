import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { GameStateData } from "../../store/gameStore";
import HalfTimeBreak from "./HalfTimeBreak";
import { createSnapshot } from "./SubPanel.testFixtures";
const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../ui", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TeamLogo: () => null,
  ThemeToggle: () => null,
}));
function setup() {
  const snapshot = { ...createSnapshot(), phase: "HalfTime", current_minute: 48 };
  const props = {
    snapshot,
    gameState: { teams: [] } as unknown as GameStateData,
    userSide: "Home" as const,
    isSpectator: false,
    importantEvents: [],
    onResume: vi.fn(),
    onUpdateSnapshot: vi.fn(),
  };
  return { props, ...render(<HalfTimeBreak {...props} />) };
}
beforeEach(() => {
  invoke.mockReset();
});
it("prevents overlapping halftime tactics while saving", async () => {
  let release!: (value: ReturnType<typeof createSnapshot>) => void;
  invoke.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const { props } = setup();
  fireEvent.click(screen.getByRole("button", { name: "4-3-3" }));
  fireEvent.click(screen.getByRole("button", { name: "4-5-1" }));
  expect(invoke).toHaveBeenCalledOnce();
  await act(async () => {
    release(props.snapshot);
  });
  expect(props.onUpdateSnapshot).toHaveBeenCalledOnce();
});
