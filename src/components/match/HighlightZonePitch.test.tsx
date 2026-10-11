import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import HighlightZonePitch from "./HighlightZonePitch";
const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("../../hooks/useReducedMotion", () => ({ useReducedMotion: () => motion.reduced }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it("shows a ball only at a recorded valid zone and uses fixed home-away orientation", () => {
  const { rerender, container } = render(<HighlightZonePitch zone="HomeBox" />);
  expect(container.querySelector("[data-recorded-ball]")).toHaveStyle({ left: "8%" });
  rerender(<HighlightZonePitch zone="AwayBox" />);
  expect(container.querySelector("[data-recorded-ball]")).toHaveStyle({ left: "92%" });
  rerender(<HighlightZonePitch zone="unknown" />);
  expect(container.querySelector("[data-recorded-ball]")).toBeNull();
  expect(screen.getByText("match.highlights.recordedZones")).toBeInTheDocument();
});

it("respects the saved reduced-motion setting for replay ball changes", () => {
  motion.reduced = true;
  const { container } = render(<HighlightZonePitch zone="AwayBox" />);
  expect(container.querySelector("[data-recorded-ball]")).toHaveClass("transition-none");
  motion.reduced = false;
});
