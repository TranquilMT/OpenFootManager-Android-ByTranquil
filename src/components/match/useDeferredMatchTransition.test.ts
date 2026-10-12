import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useDeferredMatchTransition } from "./useDeferredMatchTransition";
afterEach(() => vi.useRealTimers());
it("defers manager phase screens until a replay is released and cancels on disposal", () => {
  vi.useFakeTimers();
  const transition = vi.fn();
  const { result, rerender, unmount } = renderHook(
    ({ blocked }) => useDeferredMatchTransition(blocked),
    { initialProps: { blocked: false } },
  );
  act(() => result.current(transition));
  rerender({ blocked: true });
  act(() => vi.advanceTimersByTime(6000));
  expect(transition).not.toHaveBeenCalled();
  rerender({ blocked: false });
  act(() => vi.advanceTimersByTime(600));
  expect(transition).toHaveBeenCalledOnce();
  act(() => result.current(transition));
  unmount();
  act(() => vi.advanceTimersByTime(600));
  expect(transition).toHaveBeenCalledOnce();
});
