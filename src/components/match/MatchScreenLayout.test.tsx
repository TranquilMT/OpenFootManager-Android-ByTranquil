import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchScreenLayout from "./MatchScreenLayout";
vi.mock("../ui", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));

describe("mobile match layout", () => {
  it("bounds live match content to the viewport while retaining normal page scrolling elsewhere", () => {
    const live = render(<MatchScreenLayout contained>Live</MatchScreenLayout>);
    expect(live.container.firstElementChild).toHaveClass("h-dvh", "overflow-hidden");
    expect(screen.getByRole("main")).toHaveClass("flex", "flex-col", "min-h-0");
    live.unmount();
    const normal = render(<MatchScreenLayout>Report</MatchScreenLayout>);
    expect(normal.container.firstElementChild).not.toHaveClass("h-dvh");
  });
  it("protects all four safe areas and keeps the score header sticky at every width", () => {
    const { container } = render(
      <MatchScreenLayout header="Score">Match content</MatchScreenLayout>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass(
      "pl-[env(safe-area-inset-left,0px)]",
      "pr-[env(safe-area-inset-right,0px)]",
      "pt-[env(safe-area-inset-top,0px)]",
      "pb-[env(safe-area-inset-bottom,0px)]",
    );
    expect(screen.getByRole("banner")).toHaveClass("sticky");
    expect(screen.getByRole("banner")).not.toHaveClass("sm:static");
    expect(screen.getByRole("main")).toHaveTextContent("Match content");
  });
});
