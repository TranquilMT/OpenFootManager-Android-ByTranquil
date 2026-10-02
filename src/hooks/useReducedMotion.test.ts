import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";
import { useSettingsStore } from "../store/settingsStore";

afterEach(() => {
  vi.unstubAllGlobals();
  useSettingsStore.setState((state) => ({ settings: { ...state.settings, reduce_motion: false } }));
});
describe("reduced motion", () => {
  it("honours saved preference and live OS changes", () => {
    let system = false;
    let listener = () => {};
    vi.stubGlobal("matchMedia", () => ({
      get matches() {
        return system;
      },
      addEventListener: (_: string, callback: () => void) => {
        listener = callback;
      },
      removeEventListener: vi.fn(),
    }));
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      system = true;
      listener();
    });
    expect(result.current).toBe(true);
    act(() => {
      system = false;
      listener();
      useSettingsStore.setState((state) => ({
        settings: { ...state.settings, reduce_motion: true },
      }));
    });
    expect(result.current).toBe(true);
    unmount();
  });
});
