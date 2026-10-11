import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchPlaybackControls from "./MatchPlaybackControls";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
describe("match playback controls", () => {
  it("steps exactly once from pause and sends the selected pace", () => {
    const step = vi.fn(),
      change = vi.fn();
    render(
      <MatchPlaybackControls
        speed="paused"
        disabled={false}
        onSpeedChange={change}
        onStep={step}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "match.step1Min" }));
    expect(step).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "match.fast" }));
    expect(change).toHaveBeenCalledWith("fast");
  });
  it("prevents pace and manual steps when decisions are closed", () => {
    const step = vi.fn(),
      change = vi.fn();
    render(<MatchPlaybackControls speed="paused" disabled onSpeedChange={change} onStep={step} />);
    fireEvent.click(screen.getByRole("button", { name: "match.step1Min" }));
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    expect(step).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
});
