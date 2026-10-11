import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useHighlightPlayback } from "./useHighlightPlayback";
afterEach(() => {
  vi.useRealTimers();
});
it("paces replay actions without invoking the match engine and cleans up on disposal", () => {
  vi.useFakeTimers();
  const { result, unmount } = renderHook(() => useHighlightPlayback("clip", 3));
  act(() => {
    result.current.dispatch({ type: "play" });
  });
  act(() => {
    vi.advanceTimersByTime(900);
  });
  expect(result.current.frame).toBe(1);
  act(() => {
    vi.advanceTimersByTime(900);
  });
  expect(result.current.frame).toBe(2);
  expect(result.current.playing).toBe(false);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
