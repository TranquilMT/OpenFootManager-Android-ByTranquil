import { Suspense, lazy, useId } from "react";
import { useTranslation } from "react-i18next";
import { Button, DatePicker, Select } from "../ui";
import { AlertCircle, ChevronRight, X } from "lucide-react";
import ManagerProfileList from "./ManagerProfileList";
import type { ManagerProfile } from "./types";
const CreateManagerNationalityField = lazy(() => import("./CreateManagerNationalityField"));
export interface CreateManagerFormData {
  firstName: string;
  lastName: string;
  dob: string;
  startYear: string;
  startPhase: CareerStartPhase;
  nationality: string;
}
export type CareerStartPhase = "seasonStart" | "midSeason";
type CreateManagerField = keyof CreateManagerFormData;
interface Props {
  formData: CreateManagerFormData;
  formErrors: Partial<Record<CreateManagerField, string>>;
  dobError: string | null;
  profiles: ManagerProfile[];
  selectedProfileId?: string;
  onChange: (f: CreateManagerField, v: string) => void;
  onClearError: (f: CreateManagerField) => void;
  onClose: () => void;
  onSelectProfile: (p: ManagerProfile) => void;
  onDeleteProfile: (id: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}
function Fallback({ error }: { error?: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="mb-1.5 block text-xs font-heading font-bold uppercase text-gray-500">
        {t("createManager.countryOfOrigin")}
      </label>
      <button
        type="button"
        disabled
        className="min-h-11 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-left dark:border-navy-600 dark:bg-navy-900"
      >
        <span className="text-gray-400">{t("createManager.selectCountry")}</span>
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
export default function CreateManagerForm(p: Props) {
  const { t, i18n } = useTranslation();
  const dobLabelId = useId();
  const field = (name: "firstName" | "lastName", label: string) => (
    <div id={`create-manager-field-${name}`} className="min-w-0">
      <label
        htmlFor={`create-manager-${name}`}
        className="mb-1.5 block text-xs font-heading font-bold uppercase tracking-wider text-gray-500"
      >
        {label}
      </label>
      <input
        id={`create-manager-${name}`}
        placeholder={t(`createManager.placeholder${name === "firstName" ? "First" : "Last"}`)}
        maxLength={30}
        className={`min-h-11 w-full rounded-lg border bg-gray-50 p-3 outline-none dark:bg-navy-900 ${p.formErrors[name] ? "border-red-400" : "border-gray-300 dark:border-navy-600"}`}
        value={p.formData[name]}
        onChange={(e) => {
          p.onChange(name, e.target.value);
          p.onClearError(name);
        }}
      />
      {p.formErrors[name] && <p className="mt-1 text-xs text-red-500">{p.formErrors[name]}</p>}
    </div>
  );
  return (
    <form onSubmit={p.onSubmit} className="flex min-h-0 w-full flex-col gap-4 pb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold uppercase">{t("createManager.title")}</h2>
        <button
          type="button"
          onClick={p.onClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
          1
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 dark:bg-navy-600" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400 dark:bg-navy-600">
          2
        </div>
      </div>
      <ManagerProfileList
        profiles={p.profiles}
        selectedProfileId={p.selectedProfileId}
        onSelect={p.onSelectProfile}
        onDelete={p.onDeleteProfile}
      />
      <div className="mobile-form-grid grid grid-cols-2 gap-3">
        {field("firstName", t("createManager.firstName"))}
        {field("lastName", t("createManager.lastName"))}
      </div>
      <div id="create-manager-field-dob">
        <label
          id={dobLabelId}
          className="mb-1.5 block text-xs font-heading font-bold uppercase text-gray-500"
        >
          {t("createManager.dob")}
        </label>
        <DatePicker
          labelledBy={dobLabelId}
          value={p.formData.dob}
          onChange={(v) => {
            p.onChange("dob", v);
            p.onClearError("dob");
          }}
          error={Boolean(p.dobError)}
        />
        {p.dobError && (
          <p className="mt-1 flex gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {p.dobError}
          </p>
        )}
      </div>
      <div className="mobile-form-grid grid grid-cols-2 gap-3">
        <div id="create-manager-field-startYear">
          <label
            htmlFor="create-manager-startYear"
            className="mb-1.5 block text-xs font-heading font-bold uppercase text-gray-500"
          >
            {t("createManager.startYear")}
          </label>
          <input
            id="create-manager-startYear"
            inputMode="numeric"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-navy-600 dark:bg-navy-900"
            value={p.formData.startYear}
            onChange={(e) => {
              p.onChange("startYear", e.target.value);
              p.onClearError("startYear");
            }}
          />
          {p.formErrors.startYear && (
            <p role="alert" className="mt-1 text-xs text-red-500">
              {p.formErrors.startYear}
            </p>
          )}
        </div>
        <div id="create-manager-field-startPhase">
          <label
            htmlFor="create-manager-startPhase"
            className="mb-1.5 block text-xs font-heading font-bold uppercase text-gray-500"
          >
            {t("createManager.startPhase")}
          </label>
          <Select
            id="create-manager-startPhase"
            fullWidth
            value={p.formData.startPhase}
            onChange={(e) => p.onChange("startPhase", e.target.value as CareerStartPhase)}
          >
            <option value="seasonStart">{t("createManager.phaseSeasonStart")}</option>
            <option value="midSeason">{t("createManager.phaseMidSeason")}</option>
          </Select>
        </div>
      </div>
      <Suspense fallback={<Fallback error={p.formErrors.nationality} />}>
        <CreateManagerNationalityField
          nationality={p.formData.nationality}
          error={p.formErrors.nationality}
          locale={i18n.language}
          onChange={(v) => p.onChange("nationality", v)}
          onClearError={() => p.onClearError("nationality")}
        />
      </Suspense>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-2 w-full"
        iconRight={<ChevronRight />}
      >
        {t("createManager.chooseWorld")}
      </Button>
    </form>
  );
}
