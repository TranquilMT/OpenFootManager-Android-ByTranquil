import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsNewModal, WHATS_NEW_DISMISSED_KEY, WHATS_NEW_SEEN_KEY } from "./WhatsNewModal";

vi.mock("../../lib/appVersion", () => ({ APP_VERSION: "0.7.5" }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { version: string }) =>
      options ? `${key} ${options.version}` : key,
  }),
}));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("WhatsNewModal", () => {
  it("presents each current update as a labelled feature", () => {
    render(<WhatsNewModal />);
    const dialog = screen.getByRole("dialog", { name: "settings.patchWelcome" });
    for (const feature of ["pitch", "commentary", "replay", "decisions", "reliability"]) {
      expect(within(dialog).getByText(`phase75.release.${feature}`)).toBeVisible();
    }
    expect(within(dialog).getByText("phase75.intro")).toBeVisible();
  });
  it("uses the current version and remembers a permanent dismissal", () => {
    render(<WhatsNewModal />);
    fireEvent.click(screen.getByRole("checkbox", { name: "menu.doNotShowWhatsNew v0.7.5" }));
    fireEvent.click(screen.getByRole("button", { name: "menu.continueToGame" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(WHATS_NEW_DISMISSED_KEY)).toBe("1");
    expect(window.sessionStorage.getItem(WHATS_NEW_SEEN_KEY)).toBe("1");
  });
  it("wraps keyboard focus and restores the triggering control on Escape", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    render(<WhatsNewModal />);
    const last = screen.getByRole("button", { name: "menu.continueToGame" });
    const first = screen.getByRole("button", { name: "settings.patchReportIssue" });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: "Escape" });
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
  it("leaves permanent suppression unset when continuing normally", () => {
    render(<WhatsNewModal />);
    fireEvent.click(screen.getByRole("button", { name: "menu.continueToGame" }));
    expect(window.sessionStorage.getItem(WHATS_NEW_SEEN_KEY)).toBe("1");
    expect(window.localStorage.getItem(WHATS_NEW_DISMISSED_KEY)).toBeNull();
  });
  it("does not reopen an update already seen in this session", () => {
    window.sessionStorage.setItem(WHATS_NEW_SEEN_KEY, "1");
    render(<WhatsNewModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
