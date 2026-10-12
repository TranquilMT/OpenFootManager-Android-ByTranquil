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

it("suspends replay progression while the match surface is hidden", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ visible }) => useHighlightPlayback("clip", 4, visible),
    { initialProps: { visible: true } },
  );
  act(() => {
    result.current.dispatch({ type: "play" });
  });
  rerender({ visible: false });
  act(() => {
    vi.advanceTimersByTime(9000);
  });
  expect(result.current.frame).toBe(0);
  rerender({ visible: true });
  act(() => {
    vi.advanceTimersByTime(900);
  });
  expect(result.current.frame).toBe(1);
});

it("resets playback when another clip is selected", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ id }) => useHighlightPlayback(id, 4), {
    initialProps: { id: "first" },
  });
  act(() => {
    result.current.dispatch({ type: "seek", frame: 2 });
    result.current.dispatch({ type: "play" });
  });
  rerender({ id: "second" });
  expect(result.current.frame).toBe(0);
  expect(result.current.playing).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it("clamps and pauses a replay when its recording becomes shorter", () => {
  const { result, rerender } = renderHook(({ length }) => useHighlightPlayback("clip", length), {
    initialProps: { length: 5 },
  });
  act(() => {
    result.current.dispatch({ type: "seek", frame: 3 });
    result.current.dispatch({ type: "play" });
  });
  rerender({ length: 2 });
  expect(result.current.frame).toBe(1);
  expect(result.current.playing).toBe(false);
});
