import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchdayQuickActions from "./MatchdayQuickActions";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("matchday shortcuts", () => {
  it("opens substitutions and sends the selected tactical plan", () => {
    const substitutions = vi.fn();
    const style = vi.fn();
    render(
      <MatchdayQuickActions
        disabled={false}
        playStyle="Balanced"
        onSubstitutions={substitutions}
        onPlayStyle={style}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "match.subs" }));
    fireEvent.click(screen.getByRole("button", { name: "common.playStyles.Defensive" }));
    expect(substitutions).toHaveBeenCalledOnce();
    expect(style).toHaveBeenCalledExactlyOnceWith("Defensive");
    expect(screen.getByRole("button", { name: "common.playStyles.Balanced" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("opens shared tactical controls from the match header", () => {
    const tactics = vi.fn();
    render(
      <MatchdayQuickActions
        disabled={false}
        playStyle="Balanced"
        onSubstitutions={vi.fn()}
        onPlayStyle={vi.fn()}
        onTactics={tactics}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "dashboard.tactics" }));
    expect(tactics).toHaveBeenCalledOnce();
  });
  it("blocks quick actions after full time or while a command is pending", () => {
    const style = vi.fn();
    render(
      <MatchdayQuickActions
        disabled
        playStyle="Balanced"
        onSubstitutions={vi.fn()}
        onPlayStyle={style}
      />,
    );
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "common.playStyles.Attacking" }));
    expect(style).not.toHaveBeenCalled();
  });
});
