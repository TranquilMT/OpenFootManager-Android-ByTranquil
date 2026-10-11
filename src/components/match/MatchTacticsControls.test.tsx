import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchTacticsControls from "./MatchTacticsControls";
import type { EngineTeamData } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const team = { formation: "4-4-2", play_style: "Balanced" } as EngineTeamData;
describe("live tactical controls", () => {
  it("preserves an imported formation instead of showing an unapplied default", () => {
    render(
      <MatchTacticsControls
        team={{ ...team, formation: "4-3-2-1" }}
        disabled={false}
        onFormationChange={vi.fn()}
        onPlayStyleChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: "tactics.formation" })).toHaveTextContent(
      "4-3-2-1",
    );
  });
  it("sends a selected formation and blocks controls during a command", () => {
    const change = vi.fn();
    const view = render(
      <MatchTacticsControls
        team={team}
        disabled={false}
        onFormationChange={change}
        onPlayStyleChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "tactics.formation" }));
    fireEvent.click(screen.getByRole("option", { name: "4-3-3" }));
    expect(change).toHaveBeenCalledWith("4-3-3");
    view.rerender(
      <MatchTacticsControls
        team={team}
        disabled
        onFormationChange={change}
        onPlayStyleChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: "tactics.formation" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "tactics.playStyle" })).toBeDisabled();
  });
});
it("preserves an imported playing style without selecting an unapplied default", () => {
  const change = vi.fn();
  render(
    <MatchTacticsControls
      team={{ ...team, play_style: "CustomPress" }}
      disabled={false}
      onFormationChange={vi.fn()}
      onPlayStyleChange={change}
    />,
  );
  expect(screen.getByRole("combobox", { name: "tactics.playStyle" })).toHaveTextContent(
    "common.playStyles.CustomPress",
  );
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("combobox", { name: "tactics.playStyle" }));
  fireEvent.click(screen.getByRole("option", { name: "common.playStyles.Balanced" }));
  expect(change).toHaveBeenCalledWith("Balanced");
});
