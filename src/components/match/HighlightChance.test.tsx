import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightChance from "./HighlightChance";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("shows only valid recorded chance probability", () => {
  const frame = { shot: { expected_goals: 0.45, goalkeeper_id: "gk" } } as MatchEvent;
  const { rerender, container } = render(<HighlightChance frame={frame} />);
  expect(screen.getByText(/0.45/)).toBeInTheDocument();
  rerender(
    <HighlightChance
      frame={{ ...frame, shot: { expected_goals: Infinity, goalkeeper_id: "gk" } }}
    />,
  );
  expect(container).toBeEmptyDOMElement();
  rerender(<HighlightChance frame={{ ...frame, shot: null }} />);
  expect(container).toBeEmptyDOMElement();
});

it("labels xG as probability rather than a shot count", () => {
  render(
    <HighlightChance
      frame={{ shot: { expected_goals: 0.25, goalkeeper_id: "gk" } } as MatchEvent}
    />,
  );
  expect(screen.getByText(/match.highlights.chanceProbability/)).toHaveTextContent("0.25");
});

it("does not display stray xG metadata on non-shooting events", () => {
  const { container } = render(
    <HighlightChance
      frame={
        {
          event_type: "PassCompleted",
          shot: { expected_goals: 0.25, goalkeeper_id: "gk" },
        } as MatchEvent
      }
    />,
  );
  expect(container).toBeEmptyDOMElement();
});
