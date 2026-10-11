import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubPanel } from "./SubPanel";
import { createSnapshot } from "./SubPanel.testFixtures";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const createProps = () => ({
  snapshot: createSnapshot(),
  side: "Home" as const,
  onSubstitute: vi.fn(),
  onFormationChange: vi.fn(),
  onPlayStyleChange: vi.fn(),
  onClose: vi.fn(),
});
describe("match decision workspace", () => {
  it("opens a dedicated tactical view and can switch to substitutions", () => {
    render(<SubPanel {...createProps()} initialView="tactics" />);
    expect(screen.getByRole("dialog", { name: "match.tacticsTab" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "tactics.formation" })).toBeInTheDocument();
    expect(screen.getByTestId("sub-panel-off-starter-1")).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "match.substitutionsTitle" }));
    expect(screen.getByRole("dialog", { name: "match.substitutionsTitle" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "tactics.formation" })).not.toBeInTheDocument();
    expect(screen.getByTestId("sub-panel-off-starter-1")).toBeVisible();
  });
  it("announces a pending decision and clears the busy state after completion", () => {
    const props = createProps();
    const view = render(<SubPanel {...props} pending />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("common.loading");
    view.rerender(<SubPanel {...props} pending={false} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
