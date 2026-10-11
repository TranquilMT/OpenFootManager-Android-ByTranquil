import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchAnalysisPanel from "./MatchAnalysisPanel";
import type { MatchSnapshot } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
describe("match analysis panel", () => {
  it("leaves chance quality unavailable in legacy reports and labels both teams", () => {
    render(
      <MatchAnalysisPanel
        snapshot={
          {
            current_minute: 90,
            home_team: { id: "h", name: "Home" },
            away_team: { id: "a", name: "Away" },
            events: [],
          } as unknown as MatchSnapshot
        }
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Away" })).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.getByText("match.analysis.explanation")).toBeInTheDocument();
  });
});
