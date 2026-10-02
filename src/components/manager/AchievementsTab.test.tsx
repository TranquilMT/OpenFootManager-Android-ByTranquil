import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ManagerData } from "../../store/types";
import AchievementsTab from "./AchievementsTab";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
    i18n: { language: "en" },
  }),
}));

const manager: ManagerData = {
  id: "manager",
  first_name: "Will",
  last_name: "Manager",
  date_of_birth: "1980-01-01",
  nationality: "MT",
  reputation: 50,
  satisfaction: 50,
  fan_approval: 50,
  team_id: null,
  career_history: [],
  career_stats: {
    matches_managed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    trophies: 0,
    best_finish: null,
  },
};

describe("AchievementsTab", () => {
  it("shows all goals and level one between clubs for legacy saves", () => {
    render(<AchievementsTab manager={manager} />);
    expect(screen.getAllByRole("heading")).toHaveLength(11);
    expect(screen.getByText('phase64.managerLevel {"level":1}')).toBeTruthy();
    expect(screen.getAllByText("phase64.achievementPending")).toHaveLength(10);
  });

  it("shows saved rewards and derived perks without a claim action", () => {
    render(
      <AchievementsTab
        manager={{
          ...manager,
          career_stats: {
            ...manager.career_stats,
            progression: {
              unlocked: [{ id: "trophy", date: "2026-09-01" }],
            },
          },
        }}
      />,
    );
    expect(screen.getByText('phase64.managerLevel {"level":2}')).toBeTruthy();
    expect(screen.getByText('phase64.managerPerks {"training":2,"performance":0}')).toBeTruthy();
    expect(screen.getAllByText("phase64.achievementPending")).toHaveLength(9);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
