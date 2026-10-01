import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { isTauri } from "@tauri-apps/api/core";
import { useSettingsStore } from "./store/settingsStore";
import i18n, { changeAppLanguage } from "./i18n";
import { formatAppVersion } from "./lib/appVersion";
import "./App.css";

const MainMenu = lazy(() => import("./pages/MainMenu"));
const TeamSelection = lazy(() => import("./pages/TeamSelection"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MatchSimulation = lazy(() => import("./pages/MatchSimulation"));
const Settings = lazy(() => import("./pages/Settings"));
const SimLab = lazy(() => import("./pages/SimLab"));
const WorldEditorPage = lazy(() => import("./pages/WorldEditor"));

function LazyFallback() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const SCALE_MAP: Record<string, string> = {
  small: "14px",
  normal: "16px",
  large: "18px",
  xlarge: "20px",
};

function MobileRuntime() {
  const location = useLocation();

  useEffect(() => {
    if (!isTauri()) return;
    document.documentElement.classList.add("native-mobile");
    document.body.classList.add("native-mobile");
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (viewport)
      viewport.content =
        "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no";

    const updateViewport = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const top = vv?.offsetTop ?? 0;
      document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
      document.documentElement.style.setProperty(
        "--keyboard-offset",
        `${Math.max(0, Math.round(window.innerHeight - height - top))}px`,
      );
      document.documentElement.classList.toggle("keyboard-open", window.innerHeight - height > 120);
    };
    updateViewport();
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      document.documentElement.classList.remove("native-mobile", "keyboard-open");
      document.body.classList.remove("native-mobile");
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const current = window.history.state ?? {};
    if (location.pathname === "/") {
      window.history.replaceState({ ...current, ofmRoot: true }, "");
    } else if (!current.ofmRoute) {
      window.history.replaceState({ ...current, ofmRoute: location.pathname }, "");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isTauri()) return;
    const onPopState = () => {
      if (window.location.pathname === "/") {
        window.history.pushState({ ofmRoot: true }, "", window.location.href);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let pendingScroll: number | undefined;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.matches("input, textarea, select, [contenteditable='true']")) return;
      window.clearTimeout(pendingScroll);
      pendingScroll = window.setTimeout(() => {
        if (!target.isConnected || document.activeElement !== target) return;
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      }, 120);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.clearTimeout(pendingScroll);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return null;
}

function App() {
  const { settings, loaded, loadSettings } = useSettingsStore();
  useEffect(() => {
    if (!loaded) loadSettings();
  }, [loaded, loadSettings]);
  useEffect(() => {
    if (!isTauri()) return;
    void (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setTitle(`Openfoot Manager ${formatAppVersion()}`);
      } catch (error) {
        console.error("Failed to set window title:", error);
      }
    })();
  }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = SCALE_MAP[settings.ui_scale] || "16px";
  }, [settings.ui_scale]);
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", settings.high_contrast);
  }, [settings.high_contrast]);
  useEffect(() => {
    if (loaded && settings.language && settings.language !== i18n.language)
      void changeAppLanguage(settings.language);
  }, [loaded, settings.language]);

  return (
    <BrowserRouter>
      <MobileRuntime />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/select-team" element={<TeamSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/match" element={<MatchSimulation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sim-lab" element={<SimLab />} />
          <Route path="/world-editor" element={<WorldEditorPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
