import { useEffect, useMemo, useRef, useState } from "react";
import type { MatchSnapshot } from "./types";
import { buildMatchHighlights, type MatchHighlight } from "./highlightModel";
import HighlightModeControls from "./HighlightModeControls";
import { useHighlightPreference } from "./useHighlightPreference";
import HighlightList from "./HighlightList";
import HighlightReplay from "./HighlightReplay";
import { reachedMatchEvents } from "./livePitchModel";
import { selectHighlights, type HighlightCategory } from "./highlightCatalogue";
import { useTranslation } from "react-i18next";
import { playlistNeighbour } from "./highlightPlaylist";
import { EventFeed } from "./MatchPanels";
export default function MatchHighlightWorkspace({
  snapshot,
  onReplayChange,
  showCommentary = true,
  replayDisabled = false,
}: {
  snapshot: MatchSnapshot;
  onReplayChange?: (active: boolean) => void;
  showCommentary?: boolean;
  replayDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<"oldest" | "newest">("newest");
  const [category, setCategory] = useState<HighlightCategory>("all");
  const [side, setSide] = useState<"all" | "Home" | "Away">("all");
  const [mode, setMode] = useHighlightPreference();
  const [selection, setSelection] = useState<{
    clip: MatchHighlight;
    playlist: MatchHighlight[];
    snapshot: MatchSnapshot;
  } | null>(null);
  const clips = useMemo(
    () =>
      buildMatchHighlights(snapshot.events, snapshot.current_minute, mode === "off" ? "key" : mode),
    [snapshot.events, snapshot.current_minute, mode],
  );
  const ownershipRef = useRef(onReplayChange);
  ownershipRef.current = onReplayChange;
  useEffect(() => {
    onReplayChange?.(!!selection);
  }, [selection, onReplayChange]);
  useEffect(() => () => ownershipRef.current?.(false), []);
  useEffect(() => {
    if (
      selection &&
      (selection.snapshot.home_team.id !== snapshot.home_team.id ||
        selection.snapshot.away_team.id !== snapshot.away_team.id ||
        snapshot.current_minute < selection.snapshot.current_minute)
    ) {
      setSelection(null);
      onReplayChange?.(false);
    }
  }, [
    selection,
    snapshot.home_team.id,
    snapshot.away_team.id,
    snapshot.current_minute,
    onReplayChange,
  ]);
  const filteredClips = selectHighlights(clips, { side, category, order });
  const previousClip = selection && playlistNeighbour(selection.playlist, selection.clip.id, -1);
  const nextClip = selection && playlistNeighbour(selection.playlist, selection.clip.id, 1);
  const navigate = (clip: MatchHighlight) =>
    setSelection((current) => (current ? { ...current, clip } : null));
  const close = () => {
    setSelection(null);
  };
  return (
    <section className="space-y-3">
      <HighlightModeControls
        value={mode}
        onChange={(next) => {
          setMode(next);
          if (next === "off") close();
        }}
      />
      {mode !== "off" && (
        <fieldset aria-label={t("match.highlights.title")} className="flex flex-wrap gap-2">
          {(["all", "Home", "Away"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={side === value}
              onClick={() => setSide(value)}
              className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm dark:bg-navy-700"
            >
              {value === "all"
                ? t("common.all")
                : value === "Home"
                  ? snapshot.home_team.name
                  : snapshot.away_team.name}
            </button>
          ))}
        </fieldset>
      )}
      {mode !== "off" && (
        <fieldset aria-label={t("match.events")} className="flex flex-wrap gap-2">
          {(["all", "goals", "chances", "incidents"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm dark:bg-navy-700"
            >
              {t(
                value === "all"
                  ? "common.all"
                  : value === "goals"
                    ? "match.eventTypes.Goal"
                    : value === "chances"
                      ? "match.shots"
                      : "match.highlights.incidents",
              )}
            </button>
          ))}
        </fieldset>
      )}
      {mode !== "off" && (
        <fieldset aria-label={t("match.highlights.newest")} className="flex gap-2">
          {(["newest", "oldest"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={order === value}
              onClick={() => setOrder(value)}
              className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm dark:bg-navy-700"
            >
              {t(`match.highlights.${value}`)}
            </button>
          ))}
        </fieldset>
      )}
      {mode === "off" ? (
        <EventFeed
          events={reachedMatchEvents(snapshot.events, snapshot.current_minute)}
          snapshot={snapshot}
          showCommentary={showCommentary}
        />
      ) : (
        <HighlightList
          clips={filteredClips}
          disabled={replayDisabled}
          snapshot={snapshot}
          ordered
          catalogueKey={`${mode}:${side}:${category}:${order}`}
          onSelect={(clip) => {
            if (replayDisabled) return;
            setSelection(structuredClone({ clip, snapshot, playlist: filteredClips }));
          }}
        />
      )}{" "}
      {selection && (
        <HighlightReplay
          clip={selection.clip}
          snapshot={selection.snapshot}
          onClose={close}
          onPreviousClip={previousClip ? () => navigate(previousClip) : undefined}
          onNextClip={nextClip ? () => navigate(nextClip) : undefined}
        />
      )}
    </section>
  );
}
