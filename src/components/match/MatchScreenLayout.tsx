import type { ReactNode } from "react";
import { ThemeToggle } from "../ui";
interface MatchScreenLayoutProps {
  children: ReactNode;
  contentClassName?: string;
  footer?: ReactNode;
  header?: ReactNode;
  headerClassName?: string;
  headerContentClassName?: string;
  showThemeToggle?: boolean;
  themeToggleClassName?: string;
}
function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
export default function MatchScreenLayout({
  children,
  contentClassName,
  footer,
  header,
  headerClassName,
  headerContentClassName,
  showThemeToggle = true,
  themeToggleClassName,
}: MatchScreenLayoutProps) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-gray-100 text-gray-900 transition-colors duration-300 dark:bg-navy-900 dark:text-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
    >
      {header && (
        <header
          className={joinClasses(
            "sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-navy-700 dark:bg-navy-900/95",
            headerClassName,
          )}
        >
          <div
            className={joinClasses(
              "relative mx-auto w-full px-3 sm:px-4 lg:px-6",
              headerContentClassName,
            )}
          >
            <div className={showThemeToggle ? "pr-12 sm:pr-14" : undefined}>{header}</div>
            {showThemeToggle && (
              <ThemeToggle
                className={joinClasses(
                  "absolute right-3 top-2.5 sm:right-4 sm:top-3 lg:right-6",
                  themeToggleClassName,
                )}
              />
            )}
          </div>
        </header>
      )}
      <main className={joinClasses("min-h-0 min-w-0 flex-1 overflow-x-hidden", contentClassName)}>
        {children}
      </main>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
