import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightNarration from "./HighlightNarration";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("follows the selected replay action and its original clock", () => {
  const goal = {
    event_type: "Goal",
    minute: 47,
    side: "Home",
    player_id: "starter-1",
  } as MatchEvent;
  const snapshot = {
    ...createSnapshot(),
    current_minute: 90,
    events: [{ event_type: "KickOff", minute: 0 } as MatchEvent, goal],
  };
  const { rerender } = render(<HighlightNarration frame={goal} snapshot={snapshot} />);
  expect(screen.getByText("45+2'")).toBeInTheDocument();
  expect(screen.getByText("match.eventTypes.Goal")).toBeInTheDocument();
  rerender(
    <HighlightNarration
      frame={{ ...goal, event_type: "PassCompleted", minute: 9 }}
      snapshot={snapshot}
    />,
  );
  expect(screen.getByText("match.eventTypes.PassCompleted")).toBeInTheDocument();
  expect(screen.queryByText("match.eventTypes.Goal")).not.toBeInTheDocument();
});
