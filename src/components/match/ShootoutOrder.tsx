import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../ui";
import { setShootoutOrder } from "../../services/liveMatchService";
import type { MatchSnapshot } from "./types";
export default function ShootoutOrder({
  snapshot,
  side,
  disabled = false,
  onSnapshot,
  onPendingChange,
}: {
  snapshot: MatchSnapshot;
  side: "Home" | "Away";
  disabled?: boolean;
  onSnapshot: (snapshot: MatchSnapshot) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const team = side === "Home" ? snapshot.home_team : snapshot.away_team;
  const pieces = side === "Home" ? snapshot.home_set_pieces : snapshot.away_set_pieces;
  const eligible = team.players.filter((p) => !snapshot.sent_off.includes(p.id));
  const saved = pieces.penalty_order ?? [];
  const players = [...eligible].sort((a, b) => {
    const priority = (id: string) =>
      saved.includes(id)
        ? saved.indexOf(id)
        : pieces.penalty_taker === id
          ? saved.length
          : Infinity;
    return (
      priority(a.id) - priority(b.id) ||
      (b.shooting + b.composure) * (0.6 + 0.004 * b.condition) -
        (a.shooting + a.composure) * (0.6 + 0.004 * a.condition) ||
      a.id.localeCompare(b.id)
    );
  });
  async function move(index: number, offset: number) {
    if (disabled || busy.current) return;
    const ids = players.map((p) => p.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    busy.current = true;
    setPending(true);
    onPendingChange?.(true);
    setError(false);
    try {
      onSnapshot(await setShootoutOrder(side, ids));
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setPending(false);
      onPendingChange?.(false);
    }
  }
  return (
    <section
      className="w-full max-w-lg rounded-xl bg-white p-3 text-gray-900 dark:bg-navy-800 dark:text-white"
      aria-busy={pending}
    >
      <h3 className="font-heading font-bold">{t("match.shootout.order")}</h3>
      <ol className="max-h-48 overflow-y-auto">
        {players.map((p, index) => (
          <li key={p.id} className="flex items-center gap-2 py-1">
            <span className="tabular-nums">{index + 1}.</span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled || pending || index === 0}
              onClick={() => move(index, -1)}
              aria-label={t("match.shootout.earlier", { name: p.name })}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled || pending || index === players.length - 1}
              onClick={() => move(index, 1)}
              aria-label={t("match.shootout.later", { name: p.name })}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="text-red-700 dark:text-red-400">
          {t("match.shootout.orderError")}
        </p>
      )}
    </section>
  );
}
