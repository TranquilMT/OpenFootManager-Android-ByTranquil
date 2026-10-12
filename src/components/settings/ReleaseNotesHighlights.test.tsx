import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ReleaseNotes } from "./ReleaseNotes";
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));
it("introduces recorded highlight review in the in-game update notes", () => {
  render(<ReleaseNotes />);
  expect(screen.getByText("match.highlights.updateNote")).toBeInTheDocument();
  expect(screen.getByText("match.highlights.title")).toBeInTheDocument();
});
