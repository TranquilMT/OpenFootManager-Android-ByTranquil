import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import LiveMatchDetailContent from "./LiveMatchDetailContent";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("forwards replay ownership from the highlighted detail panel", () => {
  const goal = {
    event_type: "Goal",
    minute: 10,
    side: "Home",
    zone: "AwayBox",
    player_id: "starter-1",
  } as MatchEvent;
  const snapshot = { ...createSnapshot(), events: [goal] },
    change = vi.fn();
  render(
    <LiveMatchDetailContent
      activePanel="highlights"
      snapshot={snapshot}
      filteredEvents={[goal]}
      showCommentary
      derby={false}
      playerJerseyMap={new Map()}
      onReplayChange={change}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  expect(change).toHaveBeenCalledWith(true);
});
