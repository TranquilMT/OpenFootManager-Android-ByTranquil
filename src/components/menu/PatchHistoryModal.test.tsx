import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatchHistoryModal } from "./PatchHistoryModal";

vi.mock("../../lib/appVersion", () => ({ APP_VERSION: "0.7.3" }));

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));

describe("PatchHistoryModal", () => {
  it("preserves 0.7.2 notes when the current update changes", () => {
    render(<PatchHistoryModal onClose={vi.fn()} />);
    const heading = screen.getByRole("heading", { name: "v0.7.2" });
    expect(
      within(heading.nextElementSibling as HTMLElement).getByText("phase72.minutes"),
    ).toBeInTheDocument();
  });
  it("keeps released highlights attached to their own version", () => {
    render(<PatchHistoryModal onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "v0.6.4" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "v0.6.1" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "v0.6.0" })).toBeTruthy();
    const previous = screen.getByRole("heading", { name: "v0.6.2" }).nextElementSibling;
    expect(within(previous as HTMLElement).getByText("phase62.strategy")).toBeTruthy();
    expect(within(previous as HTMLElement).queryByText("phase63.finances")).toBeNull();
    const hotfix = screen.getByRole("heading", { name: "v0.5.2" });
    const notes = hotfix.nextElementSibling;
    expect(notes).not.toBeNull();
    expect(within(notes as HTMLElement).getByText("settings.hotfixOfferReview")).toBeTruthy();
    expect(within(notes as HTMLElement).queryByText("phase6.patchNames")).toBeNull();
  });
});
