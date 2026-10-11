import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HighlightActors from "./HighlightActors";
import { createSnapshot } from "./SubPanel.testFixtures";
import type { MatchEvent } from "./types";
it("names recorded actors and avoids exposing missing player identifiers", () => {
  render(
    <HighlightActors
      frame={{ player_id: "starter-1", secondary_player_id: "unknown" } as MatchEvent}
      snapshot={createSnapshot()}
    />,
  );
  expect(screen.getByText("Starter One")).toBeInTheDocument();
  expect(screen.queryByText("unknown")).not.toBeInTheDocument();
});
