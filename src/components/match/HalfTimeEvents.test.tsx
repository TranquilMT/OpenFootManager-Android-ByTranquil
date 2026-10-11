import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HalfTimeEvents from "./HalfTimeEvents";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const event = (minute: number, event_type = "Goal") =>
  ({ minute, event_type, side: "Home", player_id: "starter-1" }) as MatchEvent;
it("orders reached major events and excludes future and invalid clocks", () => {
  const snapshot = { ...createSnapshot(), current_minute: 48 };
  render(
    <HalfTimeEvents
      snapshot={snapshot}
      events={[event(55), event(40), event(-1), event(NaN), event(10)]}
    />,
  );
  expect(screen.queryByText("55'")).not.toBeInTheDocument();
  expect(screen.queryByText("-1'")).not.toBeInTheDocument();
  expect(screen.getAllByText(/^(10|40)'$/).map((node) => node.textContent)).toEqual(["10'", "40'"]);
});
it("formats halftime stoppage time from the full recorded history", () => {
  const goal = event(47);
  const snapshot = {
    ...createSnapshot(),
    current_minute: 48,
    events: [event(0, "KickOff"), goal, event(48, "HalfTime")],
  };
  render(<HalfTimeEvents snapshot={snapshot} events={[goal]} />);
  expect(screen.getByText("45+2'")).toBeInTheDocument();
});
