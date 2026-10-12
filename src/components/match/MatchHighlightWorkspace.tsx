import { useEffect, useMemo, useState } from "react";
import type { MatchSnapshot } from "./types";
import { buildMatchHighlights, type MatchHighlight } from "./highlightModel";
import HighlightModeControls, { type HighlightPreference } from "./HighlightModeControls";
import HighlightList from "./HighlightList";
import HighlightReplay from "./HighlightReplay";
import { reachedMatchEvents } from "./livePitchModel";
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
  useEffect(() => () => onReplayChange?.(false), [onReplayChange]);
  const close = () => {
    setSelection(null);
    onReplayChange?.(false);
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
      {mode === "off" ? (
        <EventFeed
          events={reachedMatchEvents(snapshot.events, snapshot.current_minute)}
          snapshot={snapshot}
          showCommentary={showCommentary}
        />
      ) : (
        <HighlightList
          clips={clips}
          snapshot={snapshot}
          onSelect={(clip) => {
            setSelection(structuredClone({ clip, snapshot }));
            onReplayChange?.(true);
          }}
        />
      )}{" "}
      {selection && (
        <HighlightReplay clip={selection.clip} snapshot={selection.snapshot} onClose={close} />
      )}
    </section>
  );
}
