import { renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useReplayScrollLock } from "./useReplayScrollLock";
it("locks background scrolling until the last replay owner closes and restores the prior style", () => {
  document.body.style.overflow = "scroll";
  const first = renderHook(() => useReplayScrollLock());
  const second = renderHook(() => useReplayScrollLock());
  expect(document.body.style.overflow).toBe("hidden");
  first.unmount();
  expect(document.body.style.overflow).toBe("hidden");
  second.unmount();
  expect(document.body.style.overflow).toBe("scroll");
  document.body.style.overflow = "";
});
