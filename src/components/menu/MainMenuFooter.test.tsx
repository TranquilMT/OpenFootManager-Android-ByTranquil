import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MainMenuFooter } from "./MainMenuFooter";

const nightly = vi.hoisted(() => vi.fn(() => true));
vi.mock("../../lib/appVersion", () => ({
  isNightlyBuild: nightly,
  formatAppVersion: () => "v0.6.6 · Build#352",
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: () => "NIGHTLY" }) }));

it("shows the nightly badge separately from the clean version/build identity", () => {
  nightly.mockReturnValue(true);
  render(<MainMenuFooter />);
  expect(screen.getByText("NIGHTLY")).toBeInTheDocument();
  expect(screen.getByText("v0.6.6 · Build#352")).toBeInTheDocument();
});

it("does not mark a stable build as nightly", () => {
  nightly.mockReturnValue(false);
  render(<MainMenuFooter />);
  expect(screen.queryByText("NIGHTLY")).not.toBeInTheDocument();
  expect(screen.getByText("v0.6.6 · Build#352")).toBeInTheDocument();
});
