import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StartupIntro, INTRO_SEEN_KEY } from "./StartupIntro";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../../hooks/useReducedMotion", () => ({ useReducedMotion: () => false }));
beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

it("holds the first credit for five seconds, fades between credits, then completes", () => {
  const done = vi.fn();
  render(<StartupIntro onComplete={done} />);
  expect(screen.getByRole("heading", { name: "TranquilGames" })).toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(5400);
  });
  expect(screen.queryByText("phase66.collaboration")).not.toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(400);
  });
  expect(screen.getByText("phase66.collaboration")).toBeInTheDocument();
  expect(screen.getByRole("img").getAttribute("src")).toBe("/openfootlogo.svg");
  act(() => {
    vi.advanceTimersByTime(5800);
  });
  expect(done).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBe("1");
});

it("can skip without waiting and cancels remaining timers", () => {
  const done = vi.fn();
  render(<StartupIntro onComplete={done} />);
  fireEvent.click(screen.getByRole("button", { name: "phase66.skip" }));
  act(() => {
    vi.advanceTimersByTime(20000);
  });
  expect(done).toHaveBeenCalledTimes(1);
});
