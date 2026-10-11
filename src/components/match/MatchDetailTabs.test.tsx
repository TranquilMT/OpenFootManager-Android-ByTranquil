import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchDetailTabs from "./MatchDetailTabs";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
describe("match detail navigation", () => {
  it("wraps keyboard focus and selects the destination panel", () => {
    const onChange = vi.fn();
    render(
      <MatchDetailTabs
        activePanel="events"
        onChange={onChange}
        voiceEnabled={false}
        voiceAvailable={false}
        onToggleVoice={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "match.events" }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("players");
    expect(screen.getByRole("tab", { name: "match.player match.stats" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "match.events" })).toHaveAttribute(
      "aria-controls",
      "match-panel-events",
    );
  });
  it("shows voice control only when speech is available", () => {
    const toggle = vi.fn();
    render(
      <MatchDetailTabs
        activePanel="stats"
        onChange={vi.fn()}
        voiceEnabled
        voiceAvailable
        onToggleVoice={toggle}
      />,
    );
    const button = screen.getByRole("button", { name: "match.voiceOff" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalledOnce();
    expect(screen.getByRole("tab", { name: "match.stats" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
it("makes recorded highlights reachable as a keyboard tab", () => {
  const change = vi.fn();
  render(
    <MatchDetailTabs
      activePanel="events"
      onChange={change}
      voiceEnabled={false}
      voiceAvailable={false}
      onToggleVoice={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "match.highlights.title" }));
  expect(change).toHaveBeenCalledWith("highlights");
});
