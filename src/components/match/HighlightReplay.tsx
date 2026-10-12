import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MatchHighlight } from "./highlightModel";
import type { MatchSnapshot } from "./types";
import { useHighlightPlayback } from "./useHighlightPlayback";
import { useMatchVisibility } from "./useMatchVisibility";
import { highlightScore } from "./highlightScore";
import HighlightZonePitch from "./HighlightZonePitch";
import HighlightNarration from "./HighlightNarration";
import HighlightActors from "./HighlightActors";
import HighlightChance from "./HighlightChance";
export default function HighlightReplay({
  clip,
  snapshot,
  onClose,
}: {
  clip: MatchHighlight;
  snapshot: MatchSnapshot;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null),
    closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  const { t } = useTranslation();
  const [pace, setPace] = useState<"slow" | "normal" | "fast">("normal");
  const playback = useHighlightPlayback(
    clip.id,
    clip.events.length,
    useMatchVisibility(),
    pace === "slow" ? 1500 : pace === "fast" ? 400 : 900,
  );
  const frame = clip.events[playback.frame];
  if (!frame) return null;
  const score = highlightScore(snapshot.events, frame);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-3">
      <section
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
          if (!(event.target instanceof HTMLInputElement)) {
            const frame =
              event.key === "ArrowLeft"
                ? playback.frame - 1
                : event.key === "ArrowRight"
                  ? playback.frame + 1
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? clip.events.length - 1
                      : null;
            if (frame !== null) {
              event.preventDefault();
              playback.dispatch({ type: "seek", frame });
            }
          }
          if (event.key !== "Tab") return;
          const controls = Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>("button, input") ?? [],
          ).filter((element) => !element.hasAttribute("disabled"));
          const first = controls[0],
            last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t("match.highlights.replay")}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white text-gray-900 shadow-xl dark:bg-navy-800 dark:text-white"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 p-3 dark:border-navy-700">
          <h2 className="font-heading text-lg font-bold">{t("match.highlights.replay")}</h2>
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            className="min-h-11 rounded-lg px-3 font-semibold"
          >
            {t("common.close")}
          </button>
        </header>
        <div className="touch-scroll min-h-0 space-y-3 overflow-auto p-3">
          {score && (
            <p className="text-center text-2xl font-bold tabular-nums">
              {score.home} – {score.away}
            </p>
          )}
          <HighlightZonePitch zone={frame.zone} />
          <HighlightNarration frame={frame} snapshot={snapshot} />
          <HighlightActors frame={frame} snapshot={snapshot} />
          <HighlightChance frame={frame} />
        </div>
        <div className="flex shrink-0 items-center gap-3 px-3 pt-3">
          <input
            type="range"
            aria-label={t("match.events")}
            min={0}
            max={Math.max(0, clip.events.length - 1)}
            step={1}
            value={playback.frame}
            onChange={(event) =>
              playback.dispatch({ type: "seek", frame: Number(event.target.value) })
            }
            className="min-h-11 min-w-0 flex-1 accent-primary-500"
          />
          <span className="shrink-0 text-xs tabular-nums">
            {playback.frame + 1} / {clip.events.length}
          </span>
        </div>
        <fieldset
          aria-label={t("match.highlights.play")}
          className="flex shrink-0 flex-wrap justify-center gap-2 px-3 py-2"
        >
          {(["slow", "normal", "fast"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={pace === value}
              onClick={() => setPace(value)}
              className={`min-h-11 rounded-lg px-3 text-sm ${pace === value ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-white" : "bg-gray-100 dark:bg-navy-700"}`}
            >
              {t(`match.${value}`)}
            </button>
          ))}
        </fieldset>
        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-gray-200 p-3 dark:border-navy-700">
          <button
            type="button"
            disabled={playback.frame === 0}
            onClick={() => playback.dispatch({ type: "seek", frame: playback.frame - 1 })}
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm dark:bg-navy-700"
          >
            {t("match.highlights.previous")}
          </button>
          <button
            type="button"
            onClick={() =>
              playback.dispatch({
                type: playback.playing
                  ? "pause"
                  : playback.frame === clip.events.length - 1
                    ? "restart"
                    : "play",
              })
            }
            className="min-h-11 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white dark:bg-primary-600"
          >
            {t(playback.playing ? "match.pause" : "match.highlights.play")}
          </button>
          <button
            type="button"
            disabled={playback.frame >= clip.events.length - 1}
            onClick={() => playback.dispatch({ type: "seek", frame: playback.frame + 1 })}
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm dark:bg-navy-700"
          >
            {t("match.highlights.next")}
          </button>
        </footer>
      </section>
    </div>
  );
}
