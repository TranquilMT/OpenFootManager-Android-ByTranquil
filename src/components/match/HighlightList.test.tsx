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

it("shows an explicit empty state rather than a blank highlight panel", () => {
  render(<HighlightList clips={[]} snapshot={createSnapshot()} onSelect={vi.fn()} />);
  expect(screen.getByText("match.noEventsYet")).toBeInTheDocument();
});

it("pages long highlight catalogues in manageable groups", () => {
  const clips = buildMatchHighlights(
    Array.from(
      { length: 25 },
      (_, i) =>
        ({
          event_type: "Goal",
          minute: i + 1,
          side: "Home",
          zone: "AwayBox",
          player_id: "starter-1",
          secondary_player_id: null,
        }) as MatchEvent,
    ),
    30,
  );
  render(<HighlightList clips={clips} snapshot={createSnapshot()} onSelect={vi.fn()} />);
  expect(screen.getAllByRole("button", { name: /match.highlights.replay/ })).toHaveLength(12);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.more" }));
  expect(screen.getAllByRole("button", { name: /match.highlights.replay/ })).toHaveLength(24);
});

it("collapses expanded history and resets the page when its filter scope changes", () => {
  const clips = buildMatchHighlights(
    Array.from(
      { length: 20 },
      (_, i) =>
        ({
          event_type: "Goal",
          minute: i + 1,
          side: "Home",
          zone: "AwayBox",
          player_id: "starter-1",
          secondary_player_id: null,
        }) as MatchEvent,
    ),
    30,
  );
  const { rerender } = render(
    <HighlightList
      clips={clips}
      snapshot={createSnapshot()}
      onSelect={vi.fn()}
      catalogueKey="home"
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.more" }));
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.less" }));
  expect(screen.getAllByRole("button", { name: /match.highlights.replay/ })).toHaveLength(12);
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.more" }));
  rerender(
    <HighlightList
      clips={clips}
      snapshot={createSnapshot()}
      onSelect={vi.fn()}
      catalogueKey="away"
    />,
  );
  expect(screen.getAllByRole("button", { name: /match.highlights.replay/ })).toHaveLength(12);
});

it("preserves the selected catalogue ordering instead of reversing it again", () => {
  const events = [
    {
      event_type: "Goal",
      minute: 10,
      side: "Home",
      zone: "AwayBox",
      player_id: "starter-1",
      secondary_player_id: null,
    },
    {
      event_type: "Goal",
      minute: 20,
      side: "Home",
      zone: "AwayBox",
      player_id: "starter-1",
      secondary_player_id: null,
    },
  ] as MatchEvent[];
  const clips = buildMatchHighlights(events, 30);
  render(
    <HighlightList
      clips={clips}
      snapshot={{ ...createSnapshot(), events }}
      onSelect={vi.fn()}
      ordered
    />,
  );
  expect(screen.getAllByRole("button", { name: /match.highlights.replay/ })[0]).toHaveTextContent(
    "10'",
  );
});
