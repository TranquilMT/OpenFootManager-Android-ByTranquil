interface WorldEditorLayoutProps {
  topBar: React.ReactNode;
  sidebar: React.ReactNode;
  listPanel: React.ReactNode | null;
  formPanel: React.ReactNode;
}
export function WorldEditorLayout({
  topBar,
  sidebar,
  listPanel,
  formPanel,
}: WorldEditorLayoutProps) {
  return (
    <div className="mobile-page-shell bg-gray-50 dark:bg-navy-900">
      {topBar}
      <div className="mobile-page-scroll flex-1 sm:overflow-hidden">
        <div className="flex min-h-full flex-col sm:h-full sm:flex-row">
          <div className="w-full shrink-0 border-b border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-800 sm:w-52 sm:border-b-0 sm:border-r sm:overflow-y-auto">
            {sidebar}
          </div>
          {listPanel !== null && (
            <div className="w-full shrink-0 border-b border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-800 sm:w-72 sm:border-b-0 sm:border-r sm:overflow-y-auto">
              {listPanel}
            </div>
          )}
          <div className="w-full flex-1 p-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:overflow-y-auto sm:p-6 scrollbar-thin">
            {formPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
