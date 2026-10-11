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
