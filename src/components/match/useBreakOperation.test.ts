import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useBreakOperation } from "./useBreakOperation";
it("serializes break decisions before React rerenders", async () => {
  const { result } = renderHook(() => useBreakOperation());
  let release!: () => void;
  const task = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  let first!: Promise<boolean>;
  act(() => {
    first = result.current.run(task);
  });
  await act(async () => {
    expect(await result.current.run(task)).toBe(false);
  });
  expect(task).toHaveBeenCalledOnce();
  expect(result.current.pending).toBe(true);
  await act(async () => {
    release();
    await first;
  });
  expect(result.current.pending).toBe(false);
});
it("rejects queued operations after disposal", async () => {
  const { result, unmount } = renderHook(() => useBreakOperation());
  const run = result.current.run;
  unmount();
  const task = vi.fn();
  expect(await run(task)).toBe(false);
  expect(task).not.toHaveBeenCalled();
});
