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
      className="min-h-[100dvh] bg-gray-100 text-gray-900 dark:bg-navy-900 dark:text-white flex flex-col transition-colors duration-300"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {header && (
        <header
          className={joinClasses(
            "shrink-0 border-b border-gray-200 dark:border-navy-700",
            headerClassName,
          )}
        >
          <div
            className={joinClasses(
              "relative mx-auto w-full px-3 sm:px-4 lg:px-6",
              headerContentClassName,
            )}
          >
            <div className={showThemeToggle ? "pr-11 sm:pr-14" : undefined}>{header}</div>
            {showThemeToggle && (
              <ThemeToggle
                className={joinClasses(
                  "absolute right-3 top-3 sm:right-4 lg:right-6 lg:top-4",
                  themeToggleClassName,
                )}
              />
            )}
          </div>
        </header>
      )}

      <main className={joinClasses("min-h-0 flex-1", contentClassName)}>{children}</main>

      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
