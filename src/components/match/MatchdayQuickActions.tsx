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
      className="touch-x min-w-0 landscape:flex-1 flex flex-nowrap gap-2 overflow-x-auto border-t border-gray-200 px-3 py-2 dark:border-navy-700"
    >
      <Button
        type="button"
        size="sm"
        className="min-h-11 shrink-0"
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
          className="min-h-11 shrink-0"
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
          className="min-h-11 shrink-0"
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
