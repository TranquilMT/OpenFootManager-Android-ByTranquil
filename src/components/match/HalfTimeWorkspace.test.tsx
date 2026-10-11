import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { GameStateData } from "../../store/gameStore";
import HalfTimeBreak from "./HalfTimeBreak";
import { createSnapshot } from "./SubPanel.testFixtures";
const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("../tactics/PhaseBlueprintPanel", () => ({
  PhaseBlueprintPanel: ({
    onTacticsPhaseChange,
    disabled,
  }: {
    onTacticsPhaseChange: (patch: { tempo: "Patient" }) => void;
    disabled: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onTacticsPhaseChange({ tempo: "Patient" })}
    >
      Patient tempo
    </button>
  ),
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../ui", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TeamLogo: () => null,
  ThemeToggle: () => null,
}));
vi.mock("./SubPanel", () => ({
  SubPanel: ({ onClose, initialView }: { onClose: () => void; initialView?: string }) => (
    <div role="dialog" aria-label={initialView}>
      <button type="button" onClick={onClose}>
        Close workspace
      </button>
    </div>
  ),
}));
function setup() {
  const props = {
    snapshot: { ...createSnapshot(), phase: "HalfTime" },
    gameState: { teams: [] } as unknown as GameStateData,
    userSide: "Home" as const,
    isSpectator: false,
    importantEvents: [],
    onResume: vi.fn(),
    onUpdateSnapshot: vi.fn(),
  };
  return { props, ...render(<HalfTimeBreak {...props} />) };
}
it("keeps the break open while a substitution workspace is open", () => {
  const { props } = setup();
  fireEvent.click(screen.getByRole("button", { name: "match.makeSubstitution" }));
  const resume = screen.getByRole("button", { name: "match.resumeMatch" });
  expect(resume).toBeDisabled();
  fireEvent.click(resume);
  expect(props.onResume).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Close workspace" }));
  expect(resume).toBeEnabled();
});
it("opens substitutions directly instead of a mixed tactics workspace", () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "match.makeSubstitution" }));
  expect(screen.getByRole("dialog", { name: "substitutions" })).toBeInTheDocument();
});

it("applies phase instructions through the shared halftime decision lock", async () => {
  const { props } = setup();
  invoke.mockResolvedValueOnce(props.snapshot);
  fireEvent.click(screen.getByRole("button", { name: "Patient tempo" }));
  await act(async () => {});
  expect(invoke).toHaveBeenCalledWith("apply_match_command", {
    command: { ChangeTacticalInstruction: { side: "Home", instruction: { Tempo: "Patient" } } },
  });
  expect(props.onUpdateSnapshot).toHaveBeenCalledOnce();
});
