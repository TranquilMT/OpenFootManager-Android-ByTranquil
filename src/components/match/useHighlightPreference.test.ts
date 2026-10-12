import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
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
