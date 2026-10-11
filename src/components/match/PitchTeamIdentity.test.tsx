import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PitchTeamIdentity from "./PitchTeamIdentity";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
describe("pitch team identity", () => {
  it("marks current possession without leaving a stale marker on the other club", () => {
    const view = render(
      <PitchTeamIdentity side="Home" name="Home FC" formation="4-4-2" inPossession />,
    );
    expect(screen.getByLabelText("match.possession")).toBeInTheDocument();
    view.rerender(
      <PitchTeamIdentity side="Home" name="Home FC" formation="4-4-2" inPossession={false} />,
    );
    expect(screen.queryByLabelText("match.possession")).not.toBeInTheDocument();
  });
  it("keeps side and club identity readable alongside formation", () => {
    render(
      <PitchTeamIdentity side="Away" name="A Very Long Football Club Name" formation="4-2-3-1" />,
    );
    expect(screen.getByText("match.away")).toBeInTheDocument();
    expect(screen.getByText("A Very Long Football Club Name")).toBeInTheDocument();
    expect(screen.getByText("4-2-3-1")).toBeInTheDocument();
  });
});
