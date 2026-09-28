import { Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader } from "../ui";
interface Props {
  currentFocus: string;
  currentIntensity: string;
  currentSchedule: string;
  isSaving: boolean;
  todayWeekday: number;
  isTodayTraining: boolean;
  activeFocusAttrs: string[];
  onSetTraining: (focus: string, intensity: string) => void;
  onSetSchedule: (schedule: string) => void;
  scheduleIds: readonly string[];
  scheduleIcons: Record<string, React.ReactNode>;
  scheduleColors: Record<string, string>;
  dayKeys: readonly string[];
  trainingFocusIds: readonly string[];
  trainingFocusIcons: Record<string, React.ReactNode>;
  trainingFocusAttrs: Record<string, string[]>;
  intensityIds: readonly string[];
  intensityColors: Record<string, string>;
}
export default function TrainingSettingsPanel(p: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Card accent="accent">
        <CardHeader>{t("training.weeklySchedule")}</CardHeader>
        <CardBody>
          <div className="touch-x -mx-1 flex gap-2 px-1 pb-1 sm:mx-0 sm:gap-3 sm:px-0">
            {p.scheduleIds.map((id) => (
              <button
                type="button"
                key={id}
                disabled={p.isSaving}
                onClick={() => p.onSetSchedule(id)}
                className={`min-h-24 w-[72vw] max-w-[16rem] shrink-0 rounded-xl border-2 p-3 text-left transition-all sm:min-h-0 sm:w-auto sm:max-w-none sm:flex-1 ${p.currentSchedule === id ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "border-gray-200 active:bg-gray-50 dark:border-navy-600 dark:active:bg-navy-700/50"} ${p.isSaving ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className={`mb-1.5 ${p.scheduleColors[id]}`}>{p.scheduleIcons[id]}</div>
                <p className="text-sm font-heading font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  {t(`training.schedules.${id}.label`)}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {t(`training.schedules.${id}.desc`)}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t(`training.schedules.${p.currentSchedule}.detail`)}{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: t("training.todayIs", {
                  day: t(`training.days.${p.dayKeys[p.todayWeekday]}`),
                  type: p.isTodayTraining ? t("training.aTrainingDay") : t("training.aRestDay"),
                }),
              }}
            />
          </p>
        </CardBody>
      </Card>
      <Card accent="primary">
        <CardHeader>{t("training.trainingFocus")}</CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {p.trainingFocusIds.map((id) => (
              <button
                type="button"
                key={id}
                disabled={p.isSaving}
                onClick={() => p.onSetTraining(id, p.currentIntensity)}
                className={`min-h-28 rounded-xl border-2 p-3 text-left transition-all sm:p-4 ${p.currentFocus === id ? "border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10 dark:bg-primary-500/10" : "border-gray-200 active:bg-gray-50 dark:border-navy-600 dark:active:bg-navy-700/50"} ${p.isSaving ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className="mb-2 text-gray-600 dark:text-gray-300">
                  {p.trainingFocusIcons[id]}
                </div>
                <p className="text-xs font-heading font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 sm:text-sm">
                  {t(`training.focuses.${id}.label`)}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                  {t(`training.focuses.${id}.desc`)}
                </p>
                {p.trainingFocusAttrs[id].length > 0 ? (
                  <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                    {p.trainingFocusAttrs[id].map((a) => (
                      <span
                        key={a}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-heading uppercase tracking-wider text-gray-500 dark:bg-navy-700 dark:text-gray-400"
                      >
                        {t(`common.attributes.${a}`)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-navy-700">
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-heading font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                {t("training.intensity")}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {p.intensityIds.map((id) => (
                <button
                  type="button"
                  key={id}
                  disabled={p.isSaving}
                  onClick={() => p.onSetTraining(p.currentFocus, id)}
                  className={`min-h-14 rounded-lg border-2 p-3 text-left transition-all ${p.currentIntensity === id ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "border-gray-200 active:bg-gray-50 dark:border-navy-600 dark:active:bg-navy-700/50"} ${p.isSaving ? "pointer-events-none opacity-60" : ""}`}
                >
                  <p
                    className={`text-sm font-heading font-bold uppercase tracking-wider ${p.intensityColors[id]}`}
                  >
                    {t(`training.intensities.${id}.label`)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                    {t(`training.intensities.${id}.desc`)}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t("training.trainingAppliedNote")}
            {p.activeFocusAttrs.length > 0 ? (
              <>
                {" "}
                <span
                  dangerouslySetInnerHTML={{
                    __html: t("training.currentlyTraining", {
                      attrs: p.activeFocusAttrs.map((a) => t(`common.attributes.${a}`)).join(", "),
                      intensity: t(`training.intensities.${p.currentIntensity}.label`),
                    }),
                  }}
                />
              </>
            ) : null}
            {p.currentFocus === "Recovery" ? <> {t("training.recoveryNote")}</> : null}
          </p>
        </CardBody>
      </Card>
    </>
  );
}
