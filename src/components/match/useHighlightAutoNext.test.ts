import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useHighlightAutoNext } from "./useHighlightAutoNext";
afterEach(() => vi.useRealTimers());
it("holds the final action before advancing an opted-in playlist and cancels on disposal", () => {
  vi.useFakeTimers();
  const next = vi.fn();
  const { unmount } = renderHook(() => useHighlightAutoNext("clip", true, next));
  act(() => vi.advanceTimersByTime(1499));
  expect(next).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(next).toHaveBeenCalledOnce();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
