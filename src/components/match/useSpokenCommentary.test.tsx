import { renderHook } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import i18n, { i18nReady } from "../../i18n";
import type { MatchEvent, MatchSnapshot } from "./types";
import { useSpokenCommentary } from "./useSpokenCommentary";

const kickoff: MatchEvent = {
  minute: 0,
  event_type: "KickOff",
  side: "Home",
  zone: "Midfield",
  player_id: null,
  secondary_player_id: null,
};

const snapshot = {
  home_team: { name: "Home FC", players: [] },
  away_team: { name: "Away FC", players: [] },
  events: [kickoff],
} as unknown as MatchSnapshot;

describe("useSpokenCommentary", () => {
  beforeAll(async () => {
    await i18nReady;
    await i18n.changeLanguage("en");
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("speaks only events arriving after voice narration is enabled", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        rate = 1;
        constructor(public text: string) {}
      },
    );

    const t = i18n.t.bind(i18n);
    const { rerender, unmount } = renderHook(
      ({ events, enabled }) => useSpokenCommentary(events, snapshot, t, "en", enabled),
      { initialProps: { events: [] as MatchEvent[], enabled: false } },
    );
    rerender({ events: [kickoff], enabled: false });
    rerender({ events: [kickoff], enabled: true });
    expect(speak).not.toHaveBeenCalled();

    const later = { ...kickoff, minute: 46, event_type: "SecondHalfStart" };
    rerender({ events: [kickoff, later], enabled: true });
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].text).toMatch(/second half/i);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it("speaks the latest narratable event when a batch ends in a routine event", () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        rate = 1;
        constructor(public text: string) {}
      },
    );
    const t = i18n.t.bind(i18n);
    const { rerender, unmount } = renderHook(
      ({ events }) => useSpokenCommentary(events, snapshot, t, "en", true),
      { initialProps: { events: [] as MatchEvent[] } },
    );
    rerender({ events: [kickoff, { ...kickoff, minute: 1, event_type: "PassCompleted" }] });
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].text).toMatch(/underway|match is on/i);
    unmount();
  });

  it("stops speaking immediately when narration is turned off", () => {
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak: vi.fn(), cancel });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        constructor(public text: string) {}
      },
    );
    const t = i18n.t.bind(i18n);
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useSpokenCommentary([kickoff], snapshot, t, "en", enabled),
      { initialProps: { enabled: true } },
    );
    rerender({ enabled: false });
    expect(cancel).toHaveBeenCalledOnce();
    unmount();
  });
});
