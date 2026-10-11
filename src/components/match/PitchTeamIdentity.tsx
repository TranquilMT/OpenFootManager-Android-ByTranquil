import { useTranslation } from "react-i18next";

export default function PitchTeamIdentity({
  side,
  name,
  formation,
}: {
  side: "Home" | "Away";
  name: string;
  formation: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={`min-w-0 flex-1 ${side === "Away" ? "text-right" : ""}`}>
      <div className={`flex items-center gap-1 ${side === "Away" ? "justify-end" : ""}`}>
        <span
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 rounded-full border border-navy-500 ${side === "Home" ? "bg-white dark:bg-white" : "bg-accent-400 dark:bg-accent-400"}`}
        />
        <span className="font-semibold">{t(side === "Home" ? "match.home" : "match.away")}</span>
        <span>{formation}</span>
      </div>
      <p className="break-words">{name}</p>
    </div>
  );
}
