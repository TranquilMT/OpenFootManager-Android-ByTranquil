import { useSyncExternalStore } from "react";
import { useSettingsStore } from "../store/settingsStore";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function systemPreference() {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}
export function useReducedMotion() {
  const saved = useSettingsStore((state) => state.settings.reduce_motion);
  const system = useSyncExternalStore(subscribe, systemPreference, () => false);
  return saved || system;
}
