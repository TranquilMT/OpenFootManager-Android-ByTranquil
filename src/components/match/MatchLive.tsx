import MatchScoreboard from "./MatchScoreboard";
import LiveMatchPitch from "./LiveMatchPitch";
import LatestMatchCommentary from "./LatestMatchCommentary";
import { reachedMatchEvents } from "./livePitchModel";
import MatchAnalysisPanel from "./MatchAnalysisPanel";
import type { TacticsPhaseSettings } from "../../store/types";
import { buildTacticalInstructions } from "../tactics/tacticalInstructions";
import { MatchOperationGate } from "./matchOperationGate";
import { useLiveFeedScroll } from "./useLiveFeedScroll";
import { filterMatchEvents, type EventFilter } from "./eventFilters";
import { MatchEventFilters } from "./MatchEventFilters";
import { resolveBackendError } from "../../utils/backendI18n";
import { useMatchVisibility } from "./useMatchVisibility";
import { PlayerMatchPerformance } from "./PlayerMatchPerformance";
import { MatchDecisionAlerts } from "./MatchDecisionAlerts";
import MatchdayQuickActions from "./MatchdayQuickActions";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import type { GameStateData } from "../../store/gameStore";
import {
  type MatchSnapshot,
  type MatchEvent,
  type MinuteResult,
  type SimSpeed,
  SPEED_MS,
  MINUTES_PER_TICK,
  isPersistableSpeed,
} from "./types";
import { getEventDisplay } from "./helpers";

import { useSettingsStore } from "../../store/settingsStore";
import { EventFeed, MatchStats, Lineups } from "./MatchPanels";
import {
  cancelSpokenCommentary,
  spokenCommentaryAvailable,
  useSpokenCommentary,
} from "./useSpokenCommentary";
import MatchScreenLayout from "./MatchScreenLayout";
import { isLocalDerby } from "./derbyContext";
import { MatchPulse } from "./MatchPulse";
import { SubPanel } from "./SubPanel";
import {
  Play,
  Pause,
  FastForward,
  SkipForward,
  Users,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";

const ACTIVE_PANELS = ["events", "stats", "lineups", "players"] as const;
type ActivePanel = (typeof ACTIVE_PANELS)[number];

interface MatchLiveProps {
  snapshot: MatchSnapshot;
  gameState: GameStateData;
  userSide: "Home" | "Away" | null;
  isSpectator: boolean;
  importantEvents: MatchEvent[];
  preferredSpeed?: "slow" | "normal" | "fast";
  onPreferredSpeedChange?: (speed: "slow" | "normal" | "fast") => void;
  onSnapshotUpdate: (snap: MatchSnapshot) => void;
  onImportantEvent: (evt: MatchEvent) => void;
  onHalfTime: (phase: "HalfTime" | "ExtraTimeHalfTime") => void;
  onFullTime: () => void;
  onPenaltyShootout?: () => void;
}

export default function MatchLive({
  snapshot,
  gameState,
  userSide,
  isSpectator,
  preferredSpeed,
  onPreferredSpeedChange,
  onSnapshotUpdate,
  onImportantEvent,
  onHalfTime,
  onFullTime,
  onPenaltyShootout,
}: MatchLiveProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const matchVisible = useMatchVisibility();
  const initialSpeed: SimSpeed =
    preferredSpeed ??
    (settings.match_speed === "slow" || settings.match_speed === "fast"
      ? settings.match_speed
      : "normal");
  const [speed, setSpeed] = useState<SimSpeed>(initialSpeed);
  const [activePanel, setActivePanel] = useState<ActivePanel>("events");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [isRunning, setIsRunning] = useState(true);
  const [matchCommandPending, setMatchCommandPending] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const operationGate = useRef(new MatchOperationGate());
  const currentDecisionState = useRef({ snapshot, userSide, isSpectator });
  const lastSnapshotProp = useRef(snapshot);
  if (lastSnapshotProp.current !== snapshot) {
    currentDecisionState.current.snapshot = snapshot;
    lastSnapshotProp.current = snapshot;
  }
  currentDecisionState.current.userSide = userSide;
  currentDecisionState.current.isSpectator = isSpectator;
  const publishSnapshot = useCallback(
    (next: MatchSnapshot) => {
      if (!mountedRef.current) return;
      currentDecisionState.current.snapshot = next;
      onSnapshotUpdate(next);
    },
    [onSnapshotUpdate],
  );
  const canExecuteDecision = () => {
    const current = currentDecisionState.current;
    return (
      mountedRef.current &&
      current.userSide === userSide &&
      !current.isSpectator &&
      !["Finished", "PenaltyShootout"].includes(current.snapshot.phase)
    );
  };
  const [showSubPanel, setShowSubPanel] = useState(false);
  const [alertPlayerId, setAlertPlayerId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.spoken_match_commentary);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);
  // Track phases we've already signaled to avoid double-firing
  const signaledRef = useRef<Set<string>>(new Set());

  const homeFullTeam = gameState.teams.find((t) => t.id === snapshot.home_team.id);
  const awayFullTeam = gameState.teams.find((t) => t.id === snapshot.away_team.id);

  const playerJerseyMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of gameState.players) {
      if (p.jersey_number != null) m.set(p.id, p.jersey_number);
    }
    return m;
  }, [gameState.players]);

  const reachedEvents = useMemo(
    () => reachedMatchEvents(snapshot.events, snapshot.current_minute),
    [snapshot.events, snapshot.current_minute],
  );
  const visibleEvents = useMemo(
    () => reachedEvents.filter((event) => getEventDisplay(event).important),
    [reachedEvents],
  );
  const isFinished = snapshot.phase === "Finished";
  const decisionsClosed = isFinished || snapshot.phase === "PenaltyShootout";
  const filteredEvents = useMemo(
    () => filterMatchEvents(reachedEvents, eventFilter),
    [reachedEvents, eventFilter],
  );
  const liveFeed = useLiveFeedScroll(filteredEvents.length, activePanel === "events", eventFilter);

  // Reads only `lastResult` for phase transitions, which is sound because step_many stops on
  // entering any phase that needs the manager — so a half time, shootout or finish is always the
  // last entry of a batch, never buried in the middle. See `phase_needs_manager` in
  // ofm_core/live_match_manager.rs; MINUTES_PER_TICK on this side is what makes batches possible.
  const stepMatch = useCallback(
    async (minutes: number) => {
      await operationGate.current.run(async () => {
        try {
          const results = await invoke<MinuteResult[]>("step_live_match", { minutes });
          if (!mountedRef.current) return;
          if (results.length > 0) {
            const lastResult = results[results.length - 1];

            // Collect important events
            for (const r of results) {
              for (const evt of r.events) {
                const display = getEventDisplay(evt);
                if (display.important) {
                  onImportantEvent(evt);
                }
              }
            }

            // Fetch full snapshot
            const snap = await invoke<MatchSnapshot>("get_match_snapshot");
            if (!mountedRef.current) return;
            publishSnapshot(snap);

            // Check for phase transitions that should pause
            const phase = lastResult.phase;
            if (phase === "HalfTime" && !signaledRef.current.has("HalfTime")) {
              signaledRef.current.add("HalfTime");
              setIsRunning(false);
              setSpeed("paused");
              // Small delay so the last event renders before transitioning
              phaseTimerRef.current = setTimeout(() => onHalfTime("HalfTime"), 600);
              return;
            }

            if (phase === "ExtraTimeHalfTime" && !signaledRef.current.has("ExtraTimeHalfTime")) {
              signaledRef.current.add("ExtraTimeHalfTime");
              setIsRunning(false);
              setSpeed("paused");
              phaseTimerRef.current = setTimeout(() => onHalfTime("ExtraTimeHalfTime"), 600);
              return;
            }

            if (phase === "PenaltyShootout" && !signaledRef.current.has("PenaltyShootout")) {
              signaledRef.current.add("PenaltyShootout");
              setIsRunning(false);
              setSpeed("paused");
              phaseTimerRef.current = setTimeout(() => onPenaltyShootout?.(), 600);
              return;
            }

            if (lastResult.is_finished && !signaledRef.current.has("Finished")) {
              signaledRef.current.add("Finished");
              setIsRunning(false);
              setSpeed("paused");
              phaseTimerRef.current = setTimeout(() => onFullTime(), 600);
              return;
            }
          }
        } catch (err) {
          setMatchError(resolveBackendError(err) || t("match.actionFailed"));
          setIsRunning(false);
          setSpeed("paused");
        }
      }, setMatchCommandPending);
    },
    [publishSnapshot, onImportantEvent, onHalfTime, onFullTime, onPenaltyShootout, t],
  );

  // Auto-step timer
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (
      matchVisible &&
      isRunning &&
      speed !== "paused" &&
      !isFinished &&
      !showSubPanel &&
      !matchCommandPending
    ) {
      timerRef.current = setTimeout(async () => {
        await stepMatch(MINUTES_PER_TICK[speed]);
      }, SPEED_MS[speed]);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    matchVisible,
    isRunning,
    speed,
    snapshot.current_minute,
    snapshot.phase,
    stepMatch,
    isFinished,
    showSubPanel,
    matchCommandPending,
  ]);

  useSpokenCommentary(
    visibleEvents,
    snapshot,
    t,
    i18n.language,
    voiceEnabled && settings.show_match_commentary,
  );

  // Apply substitution
  const handleSubstitution = async (playerOffId: string, playerOnId: string) => {
    if (!userSide || isSpectator || decisionsClosed) return;
    setMatchError(null);
    await operationGate.current.runCommand(async () => {
      if (!canExecuteDecision()) return;
      try {
        const snap = await invoke<MatchSnapshot>("apply_match_command", {
          command: {
            Substitute: { side: userSide, player_off_id: playerOffId, player_on_id: playerOnId },
          },
        });
        publishSnapshot(snap);
        setShowSubPanel(false);
        setAlertPlayerId(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setMatchError(resolveBackendError(err) || t("match.actionFailed"));
      }
    }, setMatchCommandPending);
  };

  const handleFormationChange = async (formation: string) => {
    if (!userSide || isSpectator || decisionsClosed) return;
    setMatchError(null);
    await operationGate.current.runCommand(async () => {
      if (!canExecuteDecision()) return;
      try {
        const snap = await invoke<MatchSnapshot>("apply_match_command", {
          command: { ChangeFormation: { side: userSide, formation } },
        });
        publishSnapshot(snap);
      } catch (err) {
        if (!mountedRef.current) return;
        setMatchError(resolveBackendError(err) || t("match.actionFailed"));
      }
    }, setMatchCommandPending);
  };

  const handlePlayStyleChange = async (playStyle: string) => {
    if (!userSide || isSpectator || decisionsClosed) return;
    setMatchError(null);
    await operationGate.current.runCommand(async () => {
      if (!canExecuteDecision()) return;
      try {
        const snap = await invoke<MatchSnapshot>("apply_match_command", {
          command: { ChangePlayStyle: { side: userSide, play_style: playStyle } },
        });
        publishSnapshot(snap);
      } catch (err) {
        if (!mountedRef.current) return;
        setMatchError(resolveBackendError(err) || t("match.actionFailed"));
      }
    }, setMatchCommandPending);
  };

  const handleTacticsPhaseChange = async (patch: Partial<TacticsPhaseSettings>) => {
    if (!userSide || isSpectator || decisionsClosed) return;
    const instructions = buildTacticalInstructions(patch);
    if (instructions.length === 0) return;
    setMatchError(null);
    await operationGate.current.runCommand(async () => {
      if (!canExecuteDecision()) return;
      try {
        for (const instruction of instructions) {
          if (!canExecuteDecision()) return;
          const snap = await invoke<MatchSnapshot>("apply_match_command", {
            command: { ChangeTacticalInstruction: { side: userSide, instruction } },
          });
          publishSnapshot(snap);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setMatchError(resolveBackendError(err) || t("match.actionFailed"));
      }
    }, setMatchCommandPending);
  };

  return (
    <MatchScreenLayout
      headerClassName="bg-linear-to-r from-gray-200 via-white to-gray-200 dark:from-navy-800 dark:via-navy-900 dark:to-navy-800"
      headerContentClassName="max-w-7xl py-3"
      contentClassName="overflow-hidden"
      contained
      showThemeToggle={false}
      header={
        <MatchScoreboard
          homeName={snapshot.home_team.name}
          awayName={snapshot.away_team.name}
          homeScore={snapshot.home_score}
          awayScore={snapshot.away_score}
          phase={snapshot.phase}
          minute={snapshot.current_minute}
          running={isRunning && matchVisible && !decisionsClosed && !showSubPanel}
        />
      }
    >
      {/* Main Content */}
      {matchError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-navy-800 dark:text-red-400"
        >
          <p>{matchError}</p>
          <button
            type="button"
            onClick={() => setMatchError(null)}
            className="min-h-11 shrink-0 rounded-lg px-3 font-semibold"
          >
            {t("common.close")}
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Left Panel: Event Feed + Stats */}
        <div className="min-h-0 flex-1 flex flex-col landscape:flex-row">
          <div className="shrink-0 landscape:w-1/2 landscape:overflow-auto">
            <div className="mx-auto w-full max-w-sm shrink-0 px-3 pt-2 sm:max-w-md lg:max-w-lg">
              <LiveMatchPitch
                snapshot={snapshot}
                playerJerseyMap={playerJerseyMap}
                userSide={isSpectator ? null : userSide}
                disabled={decisionsClosed || matchCommandPending}
                onPlayer={(id) => {
                  setAlertPlayerId(id);
                  setShowSubPanel(true);
                }}
              />
            </div>
            <LatestMatchCommentary
              snapshot={snapshot}
              showCommentary={settings.show_match_commentary}
            />
            {!isSpectator && userSide && (
              <MatchDecisionAlerts
                snapshot={snapshot}
                side={userSide}
                pending={matchCommandPending}
                onDecision={(alert) => {
                  setAlertPlayerId(alert.action === "substitution" ? alert.event.player_id : null);
                  setShowSubPanel(true);
                }}
              />
            )}
          </div>
          <div className="min-h-0 min-w-0 flex-1 flex flex-col">
            <div
              role="tablist"
              aria-label={t("match.matchDetails")}
              className="touch-x flex overflow-x-auto bg-white dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 transition-colors duration-300"
            >
              {[
                {
                  id: "events" as ActivePanel,
                  label: t("match.events"),
                  icon: <MessageSquare className="w-4 h-4" />,
                },
                {
                  id: "stats" as ActivePanel,
                  label: t("match.stats"),
                  icon: <BarChart3 className="w-4 h-4" />,
                },
                {
                  id: "lineups" as ActivePanel,
                  label: t("match.lineups"),
                  icon: <Users className="w-4 h-4" />,
                },
                {
                  id: "players" as ActivePanel,
                  label: `${t("match.player")} ${t("match.stats")}`,
                  icon: <BarChart3 className="w-4 h-4" />,
                },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  role="tab"
                  id={`match-tab-${tab.id}`}
                  aria-selected={activePanel === tab.id}
                  aria-controls={`match-panel-${tab.id}`}
                  tabIndex={activePanel === tab.id ? 0 : -1}
                  onKeyDown={(event) => {
                    const index = ACTIVE_PANELS.indexOf(tab.id);
                    const next =
                      event.key === "ArrowRight"
                        ? (index + 1) % ACTIVE_PANELS.length
                        : event.key === "ArrowLeft"
                          ? (index + ACTIVE_PANELS.length - 1) % ACTIVE_PANELS.length
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? ACTIVE_PANELS.length - 1
                              : null;
                    if (next == null) return;
                    event.preventDefault();
                    setActivePanel(ACTIVE_PANELS[next]);
                    event.currentTarget.parentElement
                      ?.querySelector<HTMLButtonElement>(`#match-tab-${ACTIVE_PANELS[next]}`)
                      ?.focus();
                  }}
                  onClick={() => setActivePanel(tab.id)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 px-4 py-3 sm:px-5 font-heading font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
                    activePanel === tab.id
                      ? "text-primary-500 dark:text-primary-400 border-primary-500 bg-primary-50 dark:bg-navy-700/50"
                      : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              {spokenCommentaryAvailable() && (
                <button
                  type="button"
                  aria-label={t(voiceEnabled ? "match.voiceOff" : "match.voiceOn")}
                  aria-pressed={voiceEnabled}
                  onClick={() => {
                    setVoiceEnabled((enabled) => !enabled);
                    void updateSettings({ spoken_match_commentary: !voiceEnabled });
                    if (voiceEnabled) cancelSpokenCommentary();
                  }}
                  className="ml-auto flex min-h-11 min-w-11 shrink-0 items-center justify-center text-gray-500 dark:text-gray-300"
                >
                  {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              )}
            </div>

            {activePanel === "events" && (
              <MatchEventFilters
                events={reachedEvents}
                value={eventFilter}
                onChange={setEventFilter}
              />
            )}
            {activePanel === "events" && !liveFeed.following && (
              <button
                type="button"
                onClick={liveFeed.jumpToLive}
                className="min-h-11 bg-primary-50 px-4 text-sm font-semibold text-primary-600 dark:bg-navy-800 dark:text-primary-400"
              >
                {t("match.jumpToLive")}
              </button>
            )}
            <div
              role="tabpanel"
              id={`match-panel-${activePanel}`}
              aria-labelledby={`match-tab-${activePanel}`}
              ref={liveFeed.feedRef}
              onScroll={liveFeed.onScroll}
              className="touch-scroll min-h-0 flex-1 overflow-auto p-3 sm:p-4"
            >
              {activePanel === "stats" && (
                <MatchPulse
                  snapshot={snapshot}
                  derby={
                    homeFullTeam && awayFullTeam ? isLocalDerby(homeFullTeam, awayFullTeam) : false
                  }
                />
              )}
              {activePanel === "events" && (
                <EventFeed
                  events={filteredEvents}
                  snapshot={snapshot}
                  playerJerseyMap={playerJerseyMap}
                  showCommentary={settings.show_match_commentary}
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
            </div>
          </div>
        </div>

        {/* Match controls stay visible while history scrolls. */}
        <aside className="shrink-0 border-t border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-800 landscape:flex landscape:items-center">
          {/* Speed Controls */}
          <div className="px-3 py-2 landscape:w-1/2">
            <div className="flex gap-1">
              {[
                {
                  id: "paused" as SimSpeed,
                  icon: <Pause className="w-4 h-4" />,
                  label: t("match.pause"),
                },
                {
                  id: "slow" as SimSpeed,
                  icon: <Play className="w-4 h-4" />,
                  label: t("match.slow"),
                },
                {
                  id: "normal" as SimSpeed,
                  icon: <Play className="w-4 h-4" />,
                  label: t("match.normal"),
                },
                {
                  id: "fast" as SimSpeed,
                  icon: <FastForward className="w-4 h-4" />,
                  label: t("match.fast"),
                },
                {
                  id: "instant" as SimSpeed,
                  icon: <SkipForward className="w-4 h-4" />,
                  label: t("match.max"),
                },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  aria-pressed={speed === s.id}
                  disabled={decisionsClosed || matchCommandPending}
                  onClick={() => {
                    setSpeed(s.id);
                    setIsRunning(s.id !== "paused");
                    if (isPersistableSpeed(s.id)) {
                      onPreferredSpeedChange?.(s.id);
                    }
                  }}
                  className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-xs font-heading uppercase tracking-wider transition-all ${
                    speed === s.id
                      ? "bg-primary-500/20 text-primary-500 dark:text-primary-400 ring-1 ring-primary-500/50"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700"
                  }`}
                >
                  {s.icon}
                  <span className="text-[10px]">{s.label}</span>
                </button>
              ))}
            </div>
            {speed === "paused" && (
              <button
                type="button"
                disabled={decisionsClosed || matchCommandPending}
                onClick={() => stepMatch(1)}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg text-sm font-heading uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                {t("match.step1Min")}
              </button>
            )}
          </div>

          {!isSpectator && userSide && (
            <MatchdayQuickActions
              disabled={decisionsClosed || matchCommandPending}
              playStyle={
                userSide === "Home" ? snapshot.home_team.play_style : snapshot.away_team.play_style
              }
              onSubstitutions={() => setShowSubPanel(true)}
              onTactics={() => setShowSubPanel(true)}
              onPlayStyle={(style) => {
                void handlePlayStyleChange(style);
              }}
            />
          )}
        </aside>
      </div>

      {/* Substitution Modal */}
      {showSubPanel && userSide && (
        <SubPanel
          snapshot={snapshot}
          side={userSide}
          initialPlayerId={alertPlayerId}
          onSubstitute={handleSubstitution}
          onFormationChange={handleFormationChange}
          onPlayStyleChange={handlePlayStyleChange}
          onTacticsPhaseChange={handleTacticsPhaseChange}
          pending={matchCommandPending}
          onClose={() => {
            setShowSubPanel(false);
            setAlertPlayerId(null);
          }}
        />
      )}
    </MatchScreenLayout>
  );
}
