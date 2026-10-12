import { useEffect, useMemo, useRef, useState } from "react";
import type { MatchSnapshot } from "./types";
import { buildMatchHighlights, type MatchHighlight } from "./highlightModel";
import HighlightModeControls, { type HighlightPreference } from "./HighlightModeControls";
import HighlightList from "./HighlightList";
import HighlightReplay from "./HighlightReplay";
import { reachedMatchEvents } from "./livePitchModel";
import { selectHighlights, type HighlightCategory } from "./highlightCatalogue";
import { useTranslation } from "react-i18next";
import { EventFeed } from "./MatchPanels";
export default function MatchHighlightWorkspace({
  snapshot,
  onReplayChange,
  showCommentary = true,
}: {
  snapshot: MatchSnapshot;
  onReplayChange?: (active: boolean) => void;
  showCommentary?: boolean;
}) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<HighlightCategory>("all");
  const [side, setSide] = useState<"all" | "Home" | "Away">("all");
  const [mode, setMode] = useState<HighlightPreference>("key");
  const [selection, setSelection] = useState<{
    clip: MatchHighlight;
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
  const filteredClips = selectHighlights(clips, { side, category });
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
      {mode === "off" ? (
        <EventFeed
          events={reachedMatchEvents(snapshot.events, snapshot.current_minute)}
          snapshot={snapshot}
          showCommentary={showCommentary}
        />
      ) : (
        <HighlightList
          clips={filteredClips}
          snapshot={snapshot}
          catalogueKey={`${mode}:${side}:${category}`}
          onSelect={(clip) => {
            setSelection(structuredClone({ clip, snapshot }));
          }}
        />
      )}{" "}
      {selection && (
        <HighlightReplay clip={selection.clip} snapshot={selection.snapshot} onClose={close} />
      )}
    </section>
  );
}
