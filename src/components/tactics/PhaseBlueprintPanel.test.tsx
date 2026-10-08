import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhaseBlueprintPanel } from "./PhaseBlueprintPanel";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("shared phase controls", () => {
  it("shows neutral defaults and sends only the selected instruction", () => {
    const change = vi.fn();
    render(<PhaseBlueprintPanel onTacticsPhaseChange={change} />);
    const tempo = screen.getByRole("combobox", { name: "tactics.phaseSettings.tempo" });
    expect(tempo).toHaveTextContent("tactics.phaseSettings.tempo_Direct");
    fireEvent.click(tempo);
    fireEvent.click(screen.getByRole("option", { name: "tactics.phaseSettings.tempo_Patient" }));
    expect(change).toHaveBeenCalledExactlyOnceWith({ tempo: "Patient" });
  });
  it("disables instructions while a match decision is pending", () => {
    render(<PhaseBlueprintPanel disabled onTacticsPhaseChange={vi.fn()} />);
    for (const control of screen.getAllByRole("combobox")) expect(control).toBeDisabled();
  });
});
