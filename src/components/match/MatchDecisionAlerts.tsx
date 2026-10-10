import { useTranslation } from "react-i18next";
import type { MatchSnapshot } from "./types";
import { matchAlerts } from "./matchAlerts";
import { getEventTypeLabel, getPlayerName } from "./helpers";
import { Button } from "../ui";
export function MatchDecisionAlerts({
  snapshot,
  side,
  pending,
  onDecision,
}: {
  snapshot: MatchSnapshot;
  side: "Home" | "Away";
  pending: boolean;
  onDecision: () => void;
}) {
  const { t } = useTranslation();
  const alerts = matchAlerts(snapshot, side);
  if (!alerts.length) return null;
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-2 flex flex-wrap gap-2">
      {alerts.map(({ event, action }) => (
        <Button
          key={event.player_id}
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11"
          aria-haspopup="dialog"
          disabled={pending}
          onClick={onDecision}
        >
          {getEventTypeLabel(event.event_type, t)} · {getPlayerName(snapshot, event.player_id)} ·{" "}
          {t(action === "tactics" ? "dashboard.tactics" : "match.subs")}
        </Button>
      ))}
    </div>
  );
}
