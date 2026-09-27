import type { JSX, ReactNode } from "react";

interface DashboardModalFrameProps {
  children: ReactNode;
  maxWidthClassName: string;
}

export default function DashboardModalFrame({
  children,
  maxWidthClassName,
}: DashboardModalFrameProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/55 p-2 pt-[max(.5rem,env(safe-area-inset-top))] pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`w-full max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-navy-600 dark:bg-navy-800 sm:p-6 ${maxWidthClassName}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
