import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightModeControls from "./HighlightModeControls";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("selects key, extended or commentary-only playback with an announced selection", () => {
  const change = vi.fn();
  render(<HighlightModeControls value="key" onChange={change} />);
  expect(screen.getByRole("button", { name: "match.highlights.key" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "match.highlights.extended" }));
  expect(change).toHaveBeenCalledWith("extended");
  fireEvent.click(screen.getByRole("button", { name: "match.events" }));
  expect(change).toHaveBeenCalledWith("off");
});
it("groups highlight choices with native fieldset semantics", () => {
  render(<HighlightModeControls value="key" onChange={vi.fn()} />);
  expect(screen.getByRole("group", { name: "match.highlights.title" }).tagName).toBe("FIELDSET");
});
