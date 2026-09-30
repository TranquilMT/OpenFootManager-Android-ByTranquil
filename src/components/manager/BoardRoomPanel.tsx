import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardBody, Button } from "../ui";
import type { GameStateData } from "../../store/gameStore";
import { useGameStore } from "../../store/gameStore";
import { getBoardRoom, negotiateManagerContract, requestBoardInvestment, type BoardRoomData } from "../../services/boardRoomService";

export default function BoardRoomPanel({ gameState }: { gameState: GameStateData }) {
  const { t, i18n } = useTranslation();
  const [room, setRoom] = useState<BoardRoomData | null>(null);
  const [salary, setSalary] = useState(1000);
  const [target, setTarget] = useState(4);
  const [years, setYears] = useState(2);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [facility, setFacility] = useState("Training");
  const teamId = gameState.manager.team_id;
  useEffect(() => {
    let active = true;
    setRoom(null);
    setStatus("");
    if (!teamId) return;
    void getBoardRoom().then((value) => {
      if (!active) return;
      setRoom(value);
      if (value.contract) { setSalary(value.contract.weekly_salary); setTarget(value.contract.league_target); }
    }).catch(() => { if (active) setStatus("phase6.unavailable"); });
    return () => { active = false; };
  }, [teamId, gameState.clock.current_date]);
  if (!teamId) return null;
  const paused = Boolean(room?.takeover_due);
  const size = Math.max(1, gameState.league?.standings.length ?? 1);
  const valid = Number.isInteger(salary) && salary >= 100 && Number.isInteger(target) && target >= 1 && target <= size;
  async function submit(investment: boolean) {
    if (busy || !room || paused || (!investment && !valid)) return;
    setBusy(true);
    setStatus("");
    try {
      const updated = investment ? await requestBoardInvestment(facility) : await negotiateManagerContract(salary, target, years);
      useGameStore.getState().setGameState(updated);
      setRoom(await getBoardRoom());
      setStatus(investment ? "phase6.investmentApproved" : "phase6.contractAgreed");
    } catch (error) {
      const key = typeof error === "string" && error.startsWith("phase6.") ? error : "phase6.offerRejected";
      setStatus(key);
    } finally { setBusy(false); }
  }
  const inputClass = "min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-900 dark:text-gray-100";
  return <Card className="md:col-span-3">
    <CardHeader>{t("phase6.boardRoom")}</CardHeader>
    <CardBody>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{t("phase6.contractHelp")}</p>
      {room?.contract && <>
        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt>{t("phase6.salary")}</dt><dd className="font-semibold">{new Intl.NumberFormat(i18n.language, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(room.contract.weekly_salary)}</dd></div>
          <div><dt>{t("phase6.expires")}</dt><dd>{room.contract.end_date}</dd></div>
          <div><dt>{t("phase6.ownership")}</dt><dd>{room.ownership_generation + 1}</dd></div>
          <div><dt>{t("phase6.style")}</dt><dd>{t(`common.playStyles.${room.contract.style}`)}</dd></div>
        </dl>
        {paused && <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{t("phase6.takeoverPause")}</p>}
        <form onSubmit={(event) => { event.preventDefault(); void submit(false); }} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm">{t("phase6.salary")}<input className={inputClass} type="number" min="100" step="1" value={salary} onChange={(event) => setSalary(Number(event.target.value))} disabled={busy || paused} /></label>
          <label className="text-sm">{t("phase6.leagueTarget")}<input className={inputClass} type="number" min="1" max={size} step="1" value={target} onChange={(event) => setTarget(Number(event.target.value))} disabled={busy || paused} /></label>
          <label className="text-sm">{t("phase6.years")}<select className={inputClass} value={years} onChange={(event) => setYears(Number(event.target.value))} disabled={busy || paused}>{[1,2,3].map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          <Button type="submit" disabled={busy || paused || !valid} className="min-h-11 sm:col-span-3">{t("phase6.negotiate")}</Button>
        </form>
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4 dark:border-navy-700">
          <label className="min-w-0 flex-1 text-sm">{t("phase6.investment")}<select className={inputClass} value={facility} onChange={(event) => setFacility(event.target.value)} disabled={busy || paused}>{["Training", "Medical", "Scouting"].map((value) => <option key={value} value={value}>{t(`finances.facility${value}`)}</option>)}</select></label>
          <Button disabled={busy || paused || gameState.manager.satisfaction < 50} onClick={() => void submit(true)} className="min-h-11">{t("phase6.requestInvestment")}</Button>
        </div>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{t("phase6.investmentHelp")}</p>
      </>}
      {status && <p role="status" className="mt-3 text-sm text-gray-700 dark:text-gray-200">{t(status)}</p>}
    </CardBody>
  </Card>;
}
