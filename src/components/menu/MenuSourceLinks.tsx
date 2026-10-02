import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";

const GITHUB_REPO_URL = "https://github.com/TranquilMT/OpenFootManager-Android-ByTranquil";
const ORIGINAL_GITHUB_REPO_URL = "https://github.com/openfootmanager/openfootmanager";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.085 3.292 9.387 7.86 10.91.575.107.785-.25.785-.555 0-.275-.01-1-.015-1.965-3.2.695-3.875-1.54-3.875-1.54-.525-1.33-1.28-1.685-1.28-1.685-1.045-.715.08-.7.08-.7 1.155.08 1.765 1.185 1.765 1.185 1.025 1.755 2.69 1.25 3.345.955.1-.745.4-1.25.725-1.54-2.555-.29-5.245-1.275-5.245-5.685 0-1.255.45-2.28 1.18-3.085-.12-.29-.515-1.46.11-3.05 0 0 .965-.31 3.165 1.18a10.95 10.95 0 0 1 2.88-.39c.98.005 1.965.135 2.885.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.235 2.76.115 3.05.735.805 1.18 1.83 1.18 3.085 0 4.42-2.695 5.39-5.265 5.675.41.355.78 1.055.78 2.125 0 1.535-.015 2.77-.015 3.15 0 .305.205.665.79.55C20.215 21.385 23.5 17.085 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function MenuSourceLinks() {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex flex-col items-start gap-1">
      <button
        type="button"
        aria-label={t("menu.openGithub")}
        title={t("menu.openGithub")}
        onClick={() => {
          void openUrl(GITHUB_REPO_URL);
        }}
        className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
      >
        <GithubIcon className="w-5 h-5" />
        <span className="text-xs font-medium">OFMtouch</span>
      </button>
      <button
        type="button"
        aria-label={t("menu.openOriginalGithub")}
        title={t("menu.openOriginalGithub")}
        onClick={() => {
          void openUrl(ORIGINAL_GITHUB_REPO_URL);
        }}
        className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
      >
        <GithubIcon className="w-5 h-5" />
        <span className="text-xs font-medium">{t("menu.originalGame")}</span>
      </button>
    </div>
  );
}
