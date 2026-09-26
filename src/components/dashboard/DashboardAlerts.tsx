import { AlertCircle, ChevronRight } from "lucide-react";
import type { JSX } from "react";
import type { DashboardAlert } from "./dashboardHelpers";

interface DashboardAlertsProps { alerts: DashboardAlert[]; onNavigate: (tab: string) => void; }
function getAlertButtonClassName(severity: DashboardAlert["severity"]): string {
  const base="flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-heading font-bold uppercase tracking-wider transition-all active:scale-[.99] sm:px-4";
  return severity==="warn"?`${base} border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400`:`${base} border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400`;
}
export default function DashboardAlerts({ alerts,onNavigate }:DashboardAlertsProps):JSX.Element|null {
  if(!alerts.length)return null;
  return <div className="mb-4 flex flex-col gap-2">{alerts.map(alert=><button type="button" key={alert.id} onClick={()=>onNavigate(alert.tab)} className={getAlertButtonClassName(alert.severity)}><AlertCircle className="h-4 w-4 shrink-0"/><span className="min-w-0 flex-1 text-left normal-case tracking-normal sm:uppercase sm:tracking-wider">{alert.text}</span><ChevronRight className="h-4 w-4 shrink-0"/></button>)}</div>;
}
