import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef, useState } from "react";
import { useSheetNavigation } from "./useSheetNavigation";

function Example() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useSheetNavigation(open, () => setOpen(false), ref);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        More
      </button>
      {open && (
        <div role="dialog" ref={ref}>
          <button type="button" onClick={() => close()}>
            Close
          </button>
          <button type="button">Last</button>
        </div>
      )}
    </>
  );
}

describe("mobile sheet navigation", () => {
  it("moves focus into the sheet and traps Tab", () => {
    render(<Example />);
    screen.getByText("More").focus();
    fireEvent.click(screen.getByText("More"));
    expect(screen.getByText("Close")).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByText("Last")).toHaveFocus();
  });
  it("closes on Back without leaving the current route", () => {
    render(<Example />);
    screen.getByText("More").focus();
    fireEvent.click(screen.getByText("More"));
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("More")).toHaveFocus();
  });
  it("Escape requests one history back operation", () => {
    const back = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => window.dispatchEvent(new PopStateEvent("popstate")));
    render(<Example />);
    screen.getByText("More").focus();
    fireEvent.click(screen.getByText("More"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(back).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    back.mockRestore();
  });
});
