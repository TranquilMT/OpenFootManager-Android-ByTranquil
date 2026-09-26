import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";
import { buildRegionLabel } from "../lib/teamRegions";
import { Badge, Card, CardBody, ThemeToggle } from "../components/ui";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import TeamSelectionScopePanel from "./TeamSelectionScopePanel";
import TeamSelectionGrid from "./TeamSelectionGrid";
import TeamSelectionSidebar from "./TeamSelectionSidebar";
import { useTeamSelection } from "./useTeamSelection";

export default function TeamSelection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gameState, setGameState, setGameActive } = useGameStore();

  const {
    clubSearch,
    setClubSearch,
    scopeExpanded,
    setScopeExpanded,
    selectedHomeRegionId,
    setSelectedHomeRegionId,
    selectedCountryCode,
    setSelectedCountryCode,
    regionSelection,
    setSelectedTeamId,
    scopeMessage,
    setScopeMessage,
    isConfirming,
    regions,
    regionCountries,
    activeRegionIds,
    availableCompetitions,
    filteredTeams,
    teamGroups,
    getTeamPlayers,
    getTeamAvgOvr,
    selectedTeam,
    selectedTeamXi,
    selectedTeamCompetitions,
    mandatoryCompetitionIds,
    competitionSelection,
    enabledCompetitionIds,
    handleRegionToggle,
    handleCompetitionToggle,
    handleConfirm,
  } = useTeamSelection({ gameState, setGameState, setGameActive, navigate });

  if (!gameState) {
    navigate("/");
    return null;
  }

  const confirmLabel = isConfirming
    ? t("teamSelect.confirming")
    : selectedTeam
      ? t("teamSelect.manage", { name: selectedTeam.short_name })
      : "";

  const ConfirmButton = ({ mobile = false }: { mobile?: boolean }) => {
    if (!selectedTeam) return null;
    return (
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirming}
        className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 font-heading text-sm font-bold uppercase tracking-wider text-white shadow-lg transition active:scale-[0.98] disabled:opacity-70 ${mobile ? "w-full" : ""}`}
      >
        <span className="truncate">{confirmLabel}</span>
        {isConfirming ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 transition-colors duration-300 dark:bg-navy-900 sm:pb-6">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur dark:border-navy-700 dark:bg-navy-800/95 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate("/")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-500 transition active:scale-95 active:bg-gray-100 dark:text-gray-300 dark:active:bg-navy-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-bold uppercase tracking-wide text-gray-800 dark:text-gray-100 sm:text-xl">
              {t("teamSelect.title")}
            </h1>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{t("teamSelect.subtitle")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block"><ConfirmButton /></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] space-y-3 p-3 sm:space-y-5 sm:p-6">
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-900 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-100 sm:hidden">
          Choose a club below. Tap a club to view its squad and details, then use the button at the bottom to begin your career.
        </div>

        {scopeMessage && (
          <Card accent="accent">
            <CardBody className="py-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{t(scopeMessage.key, scopeMessage.values)}</p>
            </CardBody>
          </Card>
        )}

        <TeamSelectionScopePanel
          scopeExpanded={scopeExpanded}
          onToggleScopeExpanded={() => setScopeExpanded((value) => !value)}
          regions={regions}
          selectedHomeRegionId={selectedHomeRegionId}
          onSelectHomeRegion={(regionId) => {
            setSelectedHomeRegionId(regionId);
            setScopeMessage(null);
          }}
          selectedCountryCode={selectedCountryCode}
          onSelectCountry={setSelectedCountryCode}
          regionCountries={regionCountries}
          regionSelection={regionSelection}
          onRegionToggle={handleRegionToggle}
          availableCompetitions={availableCompetitions}
          competitionSelection={competitionSelection}
          mandatoryCompetitionIds={mandatoryCompetitionIds}
          activeRegionIds={activeRegionIds}
          onCompetitionToggle={handleCompetitionToggle}
        />

        <div className="grid gap-3 sm:gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <TeamSelectionGrid
            clubSearch={clubSearch}
            onClubSearchChange={setClubSearch}
            filteredTeamsCount={filteredTeams.length}
            teamGroups={teamGroups}
            selectedTeamId={selectedTeam?.id ?? null}
            onSelectTeam={setSelectedTeamId}
            getTeamAvgOvr={getTeamAvgOvr}
            getTeamPlayerCount={(teamId) => getTeamPlayers(teamId).length}
          />

          <TeamSelectionSidebar
            selectedTeam={selectedTeam}
            selectedTeamXi={selectedTeamXi}
            selectedTeamCompetitions={selectedTeamCompetitions}
            getTeamAvgOvr={getTeamAvgOvr}
          />
        </div>

        <Card>
          <CardBody className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t("teamSelect.scopeSummary", { regionsCount: activeRegionIds.length, competitionsCount: enabledCompetitionIds.length })}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {activeRegionIds.map((regionId) => (
                <Badge key={regionId} variant="neutral"><span className="whitespace-nowrap">{buildRegionLabel(t, regionId)}</span></Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </main>

      {selectedTeam && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,.12)] backdrop-blur dark:border-navy-700 dark:bg-navy-800/95 sm:hidden">
          <div className="mx-auto max-w-xl"><ConfirmButton mobile /></div>
        </div>
      )}
    </div>
  );
}
