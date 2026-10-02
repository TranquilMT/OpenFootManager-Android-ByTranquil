import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import i18n, { i18nReady } from "../../i18n";
import CareerMilestones from "./CareerMilestones";
beforeAll(async () => {
  await i18nReady;
  await i18n.changeLanguage("en");
});

describe("manager career milestones", () => {
  it("shows a promotion and preserves unknown dates for earlier milestones", () => {
    render(
      <CareerMilestones
        milestones={[
          { id: "matches-100", kind: "matches", value: 100, date: null, context: null },
          {
            id: "promotion-2027",
            kind: "promotion",
            value: 2027,
            date: "2027-07-01",
            context: "Premier Division",
          },
        ]}
      />,
    );
    expect(screen.getByText("Matches managed: 100")).toBeInTheDocument();
    expect(screen.getByText("Reached earlier in this career")).toBeInTheDocument();
    expect(screen.getByText("Promoted to Premier Division (2027)")).toBeInTheDocument();
  });
});
