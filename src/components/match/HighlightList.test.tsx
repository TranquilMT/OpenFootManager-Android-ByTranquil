import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightList from "./HighlightList";
import { buildMatchHighlights } from "./highlightModel";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("offers reached clips with their outcome, player and club", () => {
  const snapshot = createSnapshot();
  const goal = {
    minute: 20,
    event_type: "Goal",
    side: "Home",
    zone: "AwayBox",
    player_id: "starter-1",
    secondary_player_id: null,
  } as MatchEvent;
  const clips = buildMatchHighlights([goal], 20),
    select = vi.fn();
  render(<HighlightList clips={clips} snapshot={snapshot} onSelect={select} />);
  expect(screen.getByText("Alpha FC")).toBeInTheDocument();
  expect(screen.getByText("Starter One")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /match.highlights.replay/ }));
  expect(select).toHaveBeenCalledWith(clips[0]);
});
