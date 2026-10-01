import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatchHistoryModal } from "./PatchHistoryModal";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));

describe("PatchHistoryModal", () => {
  it("keeps released highlights attached to their own version", () => {
    render(<PatchHistoryModal onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "v0.6.2" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "v0.6.1" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "v0.6.0" })).toBeTruthy();
    const hotfix = screen.getByRole("heading", { name: "v0.5.2" });
    const notes = hotfix.nextElementSibling;
    expect(notes).not.toBeNull();
    expect(within(notes as HTMLElement).getByText("settings.hotfixOfferReview")).toBeTruthy();
    expect(within(notes as HTMLElement).queryByText("phase6.patchNames")).toBeNull();
  });
});
