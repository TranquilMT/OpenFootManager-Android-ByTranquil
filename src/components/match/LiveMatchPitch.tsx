import { pitchPlayerLabel } from "./pitchPlayerLabel";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildLivePitchPlayers, ballZonePosition, reachedMatchEvents } from "./livePitchModel";
import type { MatchSnapshot } from "./types";

export default function LiveMatchPitch({
  snapshot,
  playerJerseyMap,
  userSide,
  onPlayer,
  disabled = false,
}: {
  snapshot: MatchSnapshot;
  playerJerseyMap?: Map<string, number>;
  userSide?: "Home" | "Away" | null;
  onPlayer?: (id: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const reached = reachedMatchEvents(snapshot.events, snapshot.current_minute);
  const latest = reached[reached.length - 1];
  const subbedOn = new Set(
    (snapshot.substitutions ?? [])
      .filter(
        (sub) =>
          Number.isFinite(sub.minute) && sub.minute >= 0 && sub.minute <= snapshot.current_minute,
      )
      .map((sub) => `${sub.side}:${sub.player_on_id}`),
  );
  const ballX = ballZonePosition(snapshot.ball_zone);
  return (
    <figure aria-label={t("match.pitchView")} className="m-0 min-w-0">
      <div className="mb-2 flex justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
        <span className="truncate">
          {snapshot.home_team.name} · {snapshot.home_team.formation}
        </span>
        <span className="truncate text-right">
          {snapshot.away_team.name} · {snapshot.away_team.formation}
        </span>
      </div>
      <div className="relative aspect-4/3 max-h-48 landscape:max-h-32 w-full overflow-hidden rounded-xl bg-primary-800 dark:bg-primary-900 sm:aspect-video">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 70"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-white/60 dark:text-white/60"
        >
          <g fill="none" stroke="currentColor" strokeWidth="0.4">
            <rect x="3" y="3" width="94" height="64" />
            <path d="M50 3V67" />
            <circle cx="50" cy="35" r="9" />
            <path d="M3 19H17V51H3 M97 19H83V51H97 M3 27H8V43H3 M97 27H92V43H97" />
          </g>
        </svg>
        {(["Home", "Away"] as const).flatMap((side) => {
          const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
          return buildLivePitchPlayers(team, side, snapshot.sent_off).map(({ player, x, y }) => {
            const booked =
              (side === "Home" ? snapshot.home_yellows : snapshot.away_yellows)?.[player.id] > 0;
            const active =
              latest?.minute === snapshot.current_minute &&
              latest.side === side &&
              latest.player_id === player.id;
            const interactive = side === userSide && onPlayer;
            const style = { left: `${x}%`, top: `${y}%` };
            const className = `absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:focus-visible:ring-accent-400 ${active ? "ring-2 ring-accent-400 dark:ring-accent-400" : ""}`;
            const token = (
              <>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm ${side === "Home" ? "border-white bg-white text-navy-900 dark:border-white dark:bg-white dark:text-navy-900" : "border-accent-400 bg-accent-400 text-navy-900 dark:border-accent-400 dark:bg-accent-400 dark:text-navy-900"}`}
                >
                  {pitchPlayerLabel(player.name, playerJerseyMap?.get(player.id))}
                </span>
                {subbedOn.has(`${side}:${player.id}`) && (
                  <span
                    role="img"
                    aria-label={t("match.eventTypes.Substitution")}
                    className="absolute bottom-0 right-0 rounded-full bg-primary-800 text-white dark:bg-primary-800 dark:text-white"
                  >
                    <ArrowUp aria-hidden="true" className="h-3 w-3" />
                  </span>
                )}
                {booked && (
                  <span
                    role="img"
                    aria-label={t("match.eventTypes.YellowCard")}
                    className="absolute right-1 top-1 h-3 w-2 rounded-sm bg-yellow-400 dark:bg-yellow-400"
                  />
                )}
              </>
            );
            return interactive ? (
              <button
                key={`${side}-${player.id}`}
                type="button"
                title={player.name}
                aria-label={player.name}
                disabled={disabled}
                onClick={() => onPlayer(player.id)}
                className={className}
                style={style}
              >
                {token}
              </button>
            ) : (
              <span
                key={`${side}-${player.id}`}
                title={player.name}
                className={className}
                style={style}
              >
                {token}
              </span>
            );
          });
        })}
        {ballX != null && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-navy-900 bg-white shadow dark:border-navy-900 dark:bg-white"
            style={{ left: `${ballX}%` }}
          />
        )}
      </div>
      <figcaption className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t("match.shapeOnly")}
      </figcaption>
    </figure>
  );
}
