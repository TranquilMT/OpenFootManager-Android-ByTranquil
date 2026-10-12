import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightActionTimeline from "./HighlightActionTimeline";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("seeks to a labelled recorded action and identifies the current one", () => {
  const seek = vi.fn();
  render(
    <HighlightActionTimeline
      events={
        [
          { minute: 9, event_type: "PassCompleted" },
          { minute: 10, event_type: "Goal" },
        ] as MatchEvent[]
      }
      frame={0}
      onSeek={seek}
    />,
  );
  expect(screen.getByRole("button", { name: /PassCompleted/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  fireEvent.click(screen.getByRole("button", { name: /Goal/ }));
  expect(seek).toHaveBeenCalledWith(1);
});

it("uses football stoppage-time clocks in the action timeline", () => {
  render(
    <HighlightActionTimeline
      events={[{ minute: 47, event_type: "Goal" }] as MatchEvent[]}
      history={[{ minute: 0, event_type: "KickOff" }] as MatchEvent[]}
      frame={0}
      onSeek={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: /45\+2/ })).toBeInTheDocument();
});
