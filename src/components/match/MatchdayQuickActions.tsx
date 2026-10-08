import { useTranslation } from "react-i18next";
import { Button } from "../ui";

export default function MatchdayQuickActions({
  disabled,
  playStyle,
  onSubstitutions,
  onPlayStyle,
  onTactics,
}: {
  disabled: boolean;
  playStyle: string;
  onSubstitutions: () => void;
  onPlayStyle: (style: string) => void;
  onTactics?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <fieldset
      aria-label={t("match.teamControls")}
      className="mt-3 flex flex-wrap gap-2 border-t border-gray-200 pt-2 dark:border-navy-700"
    >
      <Button
        type="button"
        size="sm"
        className="min-h-11"
        disabled={disabled}
        onClick={onSubstitutions}
      >
        {t("match.subs")}
      </Button>
      {onTactics && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11"
          disabled={disabled}
          onClick={onTactics}
          aria-haspopup="dialog"
        >
          {t("dashboard.tactics")}
        </Button>
      )}
      {["Balanced", "Defensive", "Attacking"].map((style) => (
        <Button
          key={style}
          type="button"
          size="sm"
          className="min-h-11"
          variant={style === playStyle ? "primary" : "outline"}
          aria-pressed={style === playStyle}
          disabled={disabled}
          onClick={() => onPlayStyle(style)}
        >
          {t(`common.playStyles.${style}`)}
        </Button>
      ))}
    </fieldset>
  );
}
