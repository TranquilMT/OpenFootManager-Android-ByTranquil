import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useHighlightPreference } from "./useHighlightPreference";
afterEach(() => localStorage.clear());
it("remembers the viewer's highlight mode when the workspace is reopened", () => {
  const first = renderHook(() => useHighlightPreference());
  expect(first.result.current[0]).toBe("key");
  act(() => first.result.current[1]("extended"));
  first.unmount();
  const second = renderHook(() => useHighlightPreference());
  expect(second.result.current[0]).toBe("extended");
});

it("ignores invalid stored modes and tolerates unavailable browser storage", () => {
  localStorage.setItem("ofm-highlight-mode", "bogus");
  const invalid = renderHook(() => useHighlightPreference());
  expect(invalid.result.current[0]).toBe("key");
  invalid.unmount();
  const get = vi.spyOn(localStorage, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const set = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const blocked = renderHook(() => useHighlightPreference());
  act(() => blocked.result.current[1]("off"));
  expect(blocked.result.current[0]).toBe("off");
  get.mockRestore();
  set.mockRestore();
});
