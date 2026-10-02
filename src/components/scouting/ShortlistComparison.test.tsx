import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import i18n, { i18nReady } from "../../i18n";
import { createGameState } from "../../pages/dashboardTestFixture";
import { formatExactMoney } from "../../lib/helpers";
import ShortlistComparison from "./ShortlistComparison";

beforeAll(async () => {
  await i18nReady;
  await i18n.changeLanguage("en");
});

describe("shortlist comparison", () => {
  it("compares ability, potential, wages and formation fit for two distinct prospects", () => {
    const player = createGameState().players[0];
    render(
      <ShortlistComparison
        players={[
          {
            ...player,
            id: "one",
            full_name: "First Prospect",
            natural_position: "Striker",
            wage: 52000,
            potential: 88,
          },
          {
            ...player,
            id: "two",
            full_name: "Second Prospect",
            natural_position: "Goalkeeper",
            wage: 104000,
            potential: 92,
          },
        ]}
        formation="4-4-2"
      />,
    );
    const table = screen.getByRole("table");
    expect(within(table).getByText("First Prospect")).toBeInTheDocument();
    expect(within(table).getByText("Second Prospect")).toBeInTheDocument();
    expect(within(table).getByText("88")).toBeInTheDocument();
    expect(within(table).getByText(formatExactMoney(1000))).toBeInTheDocument();
    expect(within(table).getByText(formatExactMoney(2000))).toBeInTheDocument();
    expect(within(table).getAllByText(/Natural fit/)).toHaveLength(2);
  });
  it("explains how to compare when fewer than two prospects are shortlisted", () => {
    render(<ShortlistComparison players={[]} formation="4-4-2" />);
    expect(screen.getByText(/Shortlist two players/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
