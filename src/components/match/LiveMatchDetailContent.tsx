import MatchHighlightWorkspace from "./MatchHighlightWorkspace";
import MatchAnalysisPanel from "./MatchAnalysisPanel";
import { PlayerMatchPerformance } from "./PlayerMatchPerformance";
import { EventFeed, MatchStats, Lineups } from "./MatchPanels";
import { MatchPulse } from "./MatchPulse";
import type { ActivePanel } from "./MatchDetailTabs";
import type { MatchEvent, MatchSnapshot } from "./types";
export default function LiveMatchDetailContent({
  activePanel,
  snapshot,
  filteredEvents,
  playerJerseyMap,
  showCommentary,
  derby,
  onReplayChange,
  replayDisabled = false,
}: {
  activePanel: ActivePanel;
  snapshot: MatchSnapshot;
  filteredEvents: MatchEvent[];
  playerJerseyMap: Map<string, number>;
  showCommentary: boolean;
  derby: boolean;
  replayDisabled?: boolean;
  onReplayChange: (active: boolean) => void;
}) {
  return (
    <>
      {" "}
      {activePanel === "highlights" && (
        <MatchHighlightWorkspace
          onReplayChange={onReplayChange}
          snapshot={snapshot}
          replayDisabled={replayDisabled}
          showCommentary={showCommentary}
        />
      )}
      {activePanel === "stats" && <MatchPulse snapshot={snapshot} derby={derby} />}
      {activePanel === "events" && (
        <EventFeed
          events={filteredEvents}
          snapshot={snapshot}
          playerJerseyMap={playerJerseyMap}
          showCommentary={showCommentary}
        />
      )}
      {activePanel === "stats" && (
        <>
          <MatchStats snapshot={snapshot} />
          <MatchAnalysisPanel snapshot={snapshot} />
        </>
      )}
      {activePanel === "players" && (
        <PlayerMatchPerformance snapshot={snapshot} playerJerseyMap={playerJerseyMap} />
      )}
      {activePanel === "lineups" && (
        <Lineups snapshot={snapshot} playerJerseyMap={playerJerseyMap} />
      )}
    </>
  );
}
