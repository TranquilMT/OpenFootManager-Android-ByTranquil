import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchScoreboard from "./MatchScoreboard";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
describe("match scoreboard", () => {
  it("keeps long team names and one clock in separate grid cells", () => {
    render(
      <MatchScoreboard
        homeName="Manchester United Football Club"
        awayName="Sunderland Association Football Club"
        homeScore={2}
        awayScore={1}
        phase="FirstHalf"
        minute={47}
        running
      />,
    );
    expect(screen.getByText("Manchester United Football Club")).toBeInTheDocument();
    expect(screen.getByText("Sunderland Association Football Club")).toBeInTheDocument();
    expect(screen.getAllByText("45+2'")).toHaveLength(1);
    expect(screen.getByLabelText("common.score")).toHaveTextContent("2 – 1");
  });
  it("announces the paused state without a second clock", () => {
    render(
      <MatchScoreboard
        homeName="Home"
        awayName="Away"
        homeScore={0}
        awayScore={0}
        phase="FirstHalf"
        minute={22}
        running={false}
      />,
    );
    expect(screen.getByText("match.paused")).toBeInTheDocument();
    expect(screen.getAllByText("22'")).toHaveLength(1);
  });
});
