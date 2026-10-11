import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SubstitutionComparison from "./SubstitutionComparison";
import type { EnginePlayerData } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const player = (id: string) =>
  ({
    id,
    name: id,
    position: "Midfielder",
    ovr: 70,
    pace: 80,
    passing: 76,
    shooting: 55,
    tackling: 65,
    condition: 82,
  }) as EnginePlayerData;
describe("substitution comparison", () => {
  it("shows both selected players and translated attribute labels before confirmation", () => {
    const confirm = vi.fn();
    render(
      <SubstitutionComparison
        selectedPlayer={player("Starter")}
        comparedPlayer={player("Reserve")}
        disabled={false}
        onClear={vi.fn()}
        onConfirm={confirm}
      />,
    );
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Reserve")).toBeInTheDocument();
    expect(screen.getByText("common.attributes.passing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "match.confirmSubstitution" }));
    expect(confirm).toHaveBeenCalledOnce();
  });
  it("blocks a pending substitution and bounds imported attributes", () => {
    render(
      <SubstitutionComparison
        selectedPlayer={{ ...player("Starter"), pace: NaN, condition: -3 }}
        comparedPlayer={{ ...player("Reserve"), pace: 150 }}
        disabled
        onClear={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "match.confirmSubstitution" })).toBeDisabled();
    expect(screen.queryByText("NaN")).not.toBeInTheDocument();
    expect(screen.queryByText("150")).not.toBeInTheDocument();
    expect(screen.queryByText("-3")).not.toBeInTheDocument();
  });
});
