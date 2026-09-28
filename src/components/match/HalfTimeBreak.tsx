import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import type { GameStateData } from "../../store/gameStore";
import {
  type MatchSnapshot,
  type MatchEvent,
  FORMATIONS,
  PLAY_STYLES,
  getTeamTalkOptions,
  type TeamTalkTone,
} from "./types";
import { getEventDisplay, getPlayerName, makeTeamFallback } from "./helpers";
import { getTalkIcon } from "./TeamTalkIcons";
import { SubPanel } from "./SubPanel";
import { Badge, TeamLogo, ThemeToggle } from "../ui";
import { Play, RefreshCw, Shield, Zap, Target, Crosshair, Flag, MessageCircle } from "lucide-react";

interface HalfTimeBreakProps {
  snapshot: MatchSnapshot;
  gameState: GameStateData;
  userSide: "Home" | "Away";
  isSpectator: boolean;
  importantEvents: MatchEvent[];
  onResume: () => void;
  onUpdateSnapshot: (snap: MatchSnapshot) => void;
}
const PLAY_STYLE_ICONS: Record<string, React.ReactNode> = {
  Balanced: <Target className="h-4 w-4" />,
  Attacking: <Zap className="h-4 w-4" />,
  Defensive: <Shield className="h-4 w-4" />,
  Possession: <RefreshCw className="h-4 w-4" />,
  Counter: <Crosshair className="h-4 w-4" />,
  HighPress: <Flag className="h-4 w-4" />,
};

export default function HalfTimeBreak({
  snapshot,
  gameState,
  userSide,
  isSpectator,
  importantEvents,
  onResume,
  onUpdateSnapshot,
}: HalfTimeBreakProps) {
  const { t } = useTranslation();
  const teamTalkOptions = getTeamTalkOptions(t);
  const [selectedTalk, setSelectedTalk] = useState<TeamTalkTone | null>(null);
  const [showSubPanel, setShowSubPanel] = useState(false);
  const [talkDelivered, setTalkDelivered] = useState(false);
  const [talkResults, setTalkResults] = useState<
    {
      player_id: string;
      player_name: string;
      old_morale: number;
      new_morale: number;
      delta: number;
    }[]
  >([]);
  const homeFullTeam = gameState.teams.find((t) => t.id === snapshot.home_team.id);
  const awayFullTeam = gameState.teams.find((t) => t.id === snapshot.away_team.id);
  const homeTeamColor = homeFullTeam?.colors?.primary || "#10b981";
  const awayTeamColor = awayFullTeam?.colors?.primary || "#6366f1";
  const userTeam = userSide === "Home" ? snapshot.home_team : snapshot.away_team;
  const firstHalfEvents = importantEvents.filter((e) =>
    [
      "Goal",
      "PenaltyGoal",
      "YellowCard",
      "RedCard",
      "SecondYellow",
      "Injury",
      "PenaltyMiss",
    ].includes(e.event_type),
  );
  const command = async (command: unknown) => {
    const snap = await invoke<MatchSnapshot>("apply_match_command", { command });
    onUpdateSnapshot(snap);
  };
  const handleFormationChange = async (formation: string) => {
    try {
      await command({ ChangeFormation: { side: userSide, formation } });
    } catch (err) {
      console.error("Formation change failed:", err);
    }
  };
  const handlePlayStyleChange = async (playStyle: string) => {
    try {
      await command({ ChangePlayStyle: { side: userSide, play_style: playStyle } });
    } catch (err) {
      console.error("Play style change failed:", err);
    }
  };
  const handleSubstitution = async (playerOffId: string, playerOnId: string) => {
    try {
      await command({
        Substitute: { side: userSide, player_off_id: playerOffId, player_on_id: playerOnId },
      });
      setShowSubPanel(false);
    } catch (err) {
      console.error("Substitution failed:", err);
    }
  };
  const handleDeliverTalk = async () => {
    if (!selectedTalk) return;
    const us = userSide === "Home" ? snapshot.home_score : snapshot.away_score;
    const them = userSide === "Home" ? snapshot.away_score : snapshot.home_score;
    const context = us > them ? "winning" : us < them ? "losing" : "drawing";
    try {
      setTalkResults(await invoke("apply_team_talk", { tone: selectedTalk, context }));
    } catch (err) {
      console.error("Team talk failed:", err);
    }
    setTalkDelivered(true);
  };
  return (
    <div
      className="min-h-[100dvh] bg-gray-100 pb-24 text-gray-900 transition-colors dark:bg-navy-900 dark:text-white sm:pb-6"
      style={{ paddingTop: "env(safe-area-inset-top,0px)" }}
    >
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur dark:border-navy-700 dark:bg-navy-800/95 sm:px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-2 sm:items-center">
            <div className="min-w-0">
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
                {snapshot.phase === "ExtraTimeHalfTime"
                  ? t("match.extraTimeHalfTime")
                  : t("match.halfTime")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                Make your changes, then resume.
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo
                team={homeFullTeam ?? makeTeamFallback(snapshot.home_team.name)}
                className="h-10 w-10 shrink-0 rounded-lg"
                imageClassName="h-8 w-8 object-contain"
                style={{
                  backgroundColor: `${homeTeamColor}30`,
                  borderColor: homeTeamColor,
                  borderWidth: 2,
                }}
              />
              <span className="truncate font-heading text-sm font-bold">
                {snapshot.home_team.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-4xl font-bold tabular-nums">
                {snapshot.home_score}
              </span>
              <span className="text-gray-400">–</span>
              <span className="font-heading text-4xl font-bold tabular-nums">
                {snapshot.away_score}
              </span>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <span className="truncate text-right font-heading text-sm font-bold">
                {snapshot.away_team.name}
              </span>
              <TeamLogo
                team={awayFullTeam ?? makeTeamFallback(snapshot.away_team.name)}
                className="h-10 w-10 shrink-0 rounded-lg"
                imageClassName="h-8 w-8 object-contain"
                style={{
                  backgroundColor: `${awayTeamColor}30`,
                  borderColor: awayTeamColor,
                  borderWidth: 2,
                }}
              />
            </div>
          </div>
          <div className="mx-auto mt-2 flex max-w-md items-center gap-2 text-xs">
            <span className="w-10 text-right font-bold text-primary-500">
              {snapshot.home_possession_pct.toFixed(0)}%
            </span>
            <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-navy-700">
              <div
                className="bg-primary-500"
                style={{ width: `${snapshot.home_possession_pct}%` }}
              />
              <div
                className="bg-indigo-500"
                style={{ width: `${snapshot.away_possession_pct}%` }}
              />
            </div>
            <span className="w-10 font-bold text-indigo-500">
              {snapshot.away_possession_pct.toFixed(0)}%
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-800">
          <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
            {t("match.firstHalfEvents")}
          </h3>
          {firstHalfEvents.length === 0 ? (
            <p className="text-sm text-gray-500">{t("match.noMajorEvents")}</p>
          ) : (
            <div className="space-y-2">
              {firstHalfEvents.map((evt, i) => {
                const d = getEventDisplay(evt);
                return (
                  <div
                    key={i}
                    className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-50 px-2 dark:bg-navy-700/50"
                  >
                    <span className="w-7 text-right text-xs text-gray-500">{evt.minute}'</span>
                    <span>{d.icon}</span>
                    <span className={`min-w-0 flex-1 truncate text-sm ${d.color}`}>
                      {getPlayerName(snapshot, evt.player_id)}
                    </span>
                    <Badge variant={evt.side === "Home" ? "primary" : "accent"} size="sm">
                      {evt.side === "Home"
                        ? snapshot.home_team.name.substring(0, 3)
                        : snapshot.away_team.name.substring(0, 3)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-800">
          {!isSpectator ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent-400" />
                <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
                  {t("match.teamTalk")}
                </h3>
              </div>
              {!talkDelivered ? (
                <>
                  <p className="mb-3 text-sm text-gray-500">{t("match.teamTalkPrompt")}</p>
                  <div className="space-y-2">
                    {teamTalkOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setSelectedTalk(opt.id)}
                        className={`flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left active:scale-[.99] ${selectedTalk === opt.id ? "bg-primary-500/20 ring-2 ring-primary-500/50" : "bg-gray-100 dark:bg-navy-700/50"}`}
                      >
                        <span className="text-xl">{getTalkIcon(opt.icon)}</span>
                        <span className="min-w-0">
                          <span className="block font-heading text-sm font-bold">{opt.label}</span>
                          <span className="block text-xs text-gray-500">{opt.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedTalk && (
                    <button
                      type="button"
                      onClick={handleDeliverTalk}
                      className="mt-3 min-h-12 w-full rounded-xl bg-primary-500 font-heading font-bold uppercase tracking-wider text-white active:scale-[.99]"
                    >
                      {t("match.deliverTeamTalk")}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>{getTalkIcon(selectedTalk || "")}</span>
                    <span className="font-heading font-bold text-primary-500">
                      {teamTalkOptions.find((o) => o.id === selectedTalk)?.label}
                    </span>
                    <Badge variant="success" size="sm">
                      {t("match.delivered")}
                    </Badge>
                  </div>
                  {talkResults.map((r) => (
                    <div key={r.player_id} className="flex min-h-10 items-center gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate">{r.player_name}</span>
                      <span
                        className={
                          r.delta > 0
                            ? "font-bold text-green-500"
                            : r.delta < 0
                              ? "font-bold text-red-500"
                              : "text-gray-500"
                        }
                      >
                        {r.delta > 0 ? "+" : ""}
                        {r.delta}
                      </span>
                      <span className="w-7 text-right">{r.new_morale}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">{t("match.spectatorHT")}</p>
          )}
        </section>
        {!isSpectator && (
          <section className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-800">
              <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
                {t("match.formation")}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {FORMATIONS.map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => handleFormationChange(f)}
                    className={`min-h-11 rounded-lg text-sm font-heading font-bold ${userTeam.formation === f ? "bg-primary-500/20 text-primary-500 ring-1 ring-primary-500/50" : "bg-gray-100 dark:bg-navy-700"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-800">
              <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
                {t("match.playStyle")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PLAY_STYLES.map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() => handlePlayStyleChange(style)}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-xs font-heading font-bold ${userTeam.play_style === style ? "bg-primary-500/20 text-primary-500 ring-1 ring-primary-500/50" : "bg-gray-100 dark:bg-navy-700"}`}
                  >
                    {PLAY_STYLE_ICONS[style]}
                    {t(`common.playStyles.${style}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-800">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-gray-500">
                  {t("match.substitutions")}
                </h3>
                <Badge variant="neutral" size="sm">
                  {userSide === "Home" ? snapshot.home_subs_made : snapshot.away_subs_made}/
                  {snapshot.max_subs}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setShowSubPanel(true)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-200 font-heading text-sm font-bold uppercase tracking-wider dark:bg-navy-700"
              >
                <RefreshCw className="h-4 w-4" />
                {t("match.makeSubstitution")}
              </button>
            </div>
          </section>
        )}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,.12)] backdrop-blur dark:border-navy-700 dark:bg-navy-800/95 sm:static sm:border-0 sm:bg-transparent sm:shadow-none">
        <button
          type="button"
          onClick={onResume}
          className="mx-auto flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 font-heading font-bold uppercase tracking-wider text-white shadow-lg active:scale-[.99]"
        >
          <Play className="h-4 w-4" />
          {t("match.resumeMatch")}
        </button>
      </div>
      {showSubPanel && (
        <SubPanel
          snapshot={snapshot}
          side={userSide}
          onSubstitute={handleSubstitution}
          onFormationChange={handleFormationChange}
          onPlayStyleChange={handlePlayStyleChange}
          onClose={() => setShowSubPanel(false)}
        />
      )}{" "}
    </div>
  );
}
