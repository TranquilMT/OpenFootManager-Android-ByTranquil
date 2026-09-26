import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { JSX, ReactNode } from "react";
import {
  Users, Calendar as CalendarIcon, Mail, Settings, LayoutDashboard, Medal, Trophy,
  TrendingUp, Globe, Crosshair, Dumbbell, DollarSign, Eye, UsersRound, UserCheck,
  Building2, UserCog, Newspaper, LogOut, GraduationCap, PanelLeftClose, PanelLeftOpen, User,
  Menu, X,
} from "lucide-react";

interface DashboardSidebarProps {
  activeTab: string; collapsed: boolean; onNavClick: (tab: string) => void; onToggleCollapse: () => void;
  unreadMessagesCount: number; todayHasMatch?: boolean; managerName: string | null; teamName: string | null;
  onNavigateSettings: () => void; onExitClick: () => void; isUnemployed: boolean;
}
interface NavItemProps { active?: boolean; badge?: number | string; collapsed: boolean; icon: ReactNode; label: string; onClick?: () => void; }
interface MobileNavItem { icon: ReactNode; label: string; tab: string; badge?: number | string; }

function NavItem({ active, badge, collapsed, icon, label, onClick }: NavItemProps): JSX.Element {
  const buttonClassName = collapsed
    ? `relative flex w-full items-center justify-center rounded-xl p-3 transition active:scale-95 ${active ? "bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`
    : `relative flex w-full items-center justify-between rounded-xl p-3 transition active:scale-[.98] ${active ? "bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`;
  return <button type="button" onClick={onClick} title={collapsed ? label : undefined} aria-label={badge ? `${label} (${badge})` : label} className={buttonClassName}>
    <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}><div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>{!collapsed && <span className="font-heading text-sm font-semibold uppercase tracking-wider">{label}</span>}</div>
    {badge !== undefined && badge !== 0 && badge !== "" && <span className={collapsed ? "absolute right-1 top-1 min-w-[1.1rem] rounded-full bg-primary-500 px-1 py-0.5 text-center text-[10px] font-bold text-white" : "min-w-5 rounded-full bg-primary-500 px-2 py-0.5 text-center text-xs font-bold text-white"}>{badge}</span>}
  </button>;
}

export default function DashboardSidebar(props: DashboardSidebarProps): JSX.Element {
  const { activeTab, collapsed, onNavClick, onToggleCollapse, unreadMessagesCount, todayHasMatch, managerName, teamName, onNavigateSettings, onExitClick, isUnemployed } = props;
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const appName = t("app.name"); const [appNamePrimary, ...secondary] = appName.split(" "); const appNameSecondary = secondary.join(" ");
  const clubItems: MobileNavItem[] = [
    { icon:<Users/>,label:t("dashboard.squad"),tab:"Squad" }, { icon:<Crosshair/>,label:t("dashboard.tactics"),tab:"Tactics" },
    { icon:<Dumbbell/>,label:t("dashboard.training"),tab:"Training" }, { icon:<UserCog/>,label:t("dashboard.staff"),tab:"Staff" },
    { icon:<Eye/>,label:t("dashboard.scouting"),tab:"Scouting" }, { icon:<GraduationCap/>,label:t("dashboard.youthAcademy"),tab:"Youth" },
    { icon:<DollarSign/>,label:t("dashboard.finances"),tab:"Finances" }, { icon:<TrendingUp/>,label:t("dashboard.transfers"),tab:"Transfers" },
  ];
  const worldItems: MobileNavItem[] = [
    { icon:<Globe/>,label:t("transfers.centre"),tab:"TransferCentre" }, { icon:<Medal/>,label:t("dashboard.hallOfFame"),tab:"HallOfFame" },
    { icon:<UsersRound/>,label:t("dashboard.players"),tab:"Players" }, { icon:<UserCheck/>,label:t("dashboard.managers"),tab:"Managers" },
    { icon:<Building2/>,label:t("dashboard.teams"),tab:"Teams" }, { icon:<Trophy/>,label:t("dashboard.tournaments"),tab:"Tournaments" },
  ];
  const primaryMobile: MobileNavItem[] = [
    { icon:<LayoutDashboard/>,label:t("dashboard.home"),tab:"Home" }, { icon:<Mail/>,label:t("dashboard.inbox"),tab:"Inbox",badge:unreadMessagesCount || undefined },
    ...(!isUnemployed ? [{ icon:<Users/>,label:t("dashboard.squad"),tab:"Squad" }] : []),
    { icon:<CalendarIcon/>,label:t("dashboard.schedule"),tab:"Schedule",badge:todayHasMatch ? "!" : undefined },
  ];
  const mobileSecondary: MobileNavItem[] = [
    { icon:<Newspaper/>,label:t("dashboard.news"),tab:"News" },
    ...(!isUnemployed ? clubItems : []),
    ...worldItems,
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.tab === item.tab) === index);

  function selectMobileTab(tab: string): void {
    setMobileMenuOpen(false);
    onNavClick(tab);
  }

  return <>
    <aside className={`hidden bg-navy-800 border-r border-navy-700 text-white h-screen sticky top-0 shrink-0 flex-col transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-64"}`}>
      <div className={`border-b border-navy-700 ${collapsed ? "px-3 py-4" : "p-5"}`}>
        <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-center justify-between gap-3"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}><div className="flex h-8 w-8 items-center justify-center"><img src="../../openfootball.svg" alt={appName} className="h-8 w-8" /></div>{!collapsed && <div><h1 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">{appNamePrimary}</h1>{appNameSecondary && <h1 className="font-heading font-bold uppercase tracking-wider text-accent-400">{appNameSecondary}</h1>}</div>}</div>
          <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? t("dashboard.expandSidebar") : t("dashboard.collapseSidebar")} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">{collapsed ? <PanelLeftOpen className="h-5 w-5"/> : <PanelLeftClose className="h-5 w-5"/>}</button>
        </div>
        <button type="button" onClick={() => onNavClick("Manager")} className={`mt-3 w-full rounded-lg hover:bg-white/5 ${collapsed ? "flex justify-center py-2 text-gray-300" : "border-t border-navy-700 pt-3 text-left"}`}>{collapsed ? <User className="h-5 w-5"/> : <><p className="text-xs uppercase tracking-wider text-gray-400">{t("dashboard.manager")}</p><p className="mt-0.5 text-sm font-semibold text-white">{managerName}</p>{teamName && <p className="mt-0.5 text-xs text-primary-400">{teamName}</p>}</>}</button>
      </div>
      <nav className={`scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
        <NavItem icon={<LayoutDashboard/>} label={t("dashboard.home")} active={activeTab==="Home"} collapsed={collapsed} onClick={()=>onNavClick("Home")}/>
        <NavItem icon={<Mail/>} label={t("dashboard.inbox")} badge={unreadMessagesCount||undefined} active={activeTab==="Inbox"} collapsed={collapsed} onClick={()=>onNavClick("Inbox")}/>
        <NavItem icon={<Newspaper/>} label={t("dashboard.news")} active={activeTab==="News"} collapsed={collapsed} onClick={()=>onNavClick("News")}/>
        <NavItem icon={<CalendarIcon/>} label={t("dashboard.schedule")} badge={todayHasMatch?"!":undefined} active={activeTab==="Schedule"} collapsed={collapsed} onClick={()=>onNavClick("Schedule")}/>
        {!isUnemployed && <><hr className="my-2 border-navy-700"/>{!collapsed&&<p className="px-3 py-1 font-heading text-[10px] uppercase tracking-widest text-gray-500">{t("dashboard.sectionClub")}</p>}{clubItems.map(item=><NavItem key={item.tab} {...item} active={activeTab===item.tab} collapsed={collapsed} onClick={()=>onNavClick(item.tab)}/>)}</>}
        <hr className="my-2 border-navy-700"/>{!collapsed&&<p className="px-3 py-1 font-heading text-[10px] uppercase tracking-widest text-gray-500">{t("dashboard.sectionWorld")}</p>}{worldItems.map(item=><NavItem key={item.tab} {...item} active={activeTab===item.tab} collapsed={collapsed} onClick={()=>onNavClick(item.tab)}/>) }
      </nav>
      <div className={`flex flex-col gap-1 border-t border-navy-700 ${collapsed?"p-2":"p-3"}`}><NavItem icon={<Settings/>} label={t("dashboard.settings")} collapsed={collapsed} onClick={onNavigateSettings}/><NavItem icon={<LogOut/>} label={t("dashboard.exitToMenu")} collapsed={collapsed} onClick={onExitClick}/></div>
    </aside>

    {mobileMenuOpen && <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={t("dashboard.sectionWorld")}>
      <button type="button" className="absolute inset-0 h-full w-full bg-black/55" onClick={()=>setMobileMenuOpen(false)} aria-label={t("common.close")}/>
      <section className="mobile-safe-bottom absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-hidden rounded-t-3xl border-t border-navy-600 bg-navy-800 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
          <button type="button" onClick={()=>selectMobileTab("Manager")} className="min-w-0 rounded-xl px-2 py-1 text-left active:bg-white/10">
            <p className="truncate text-sm font-bold">{managerName}</p>{teamName && <p className="truncate text-xs text-primary-400">{teamName}</p>}
          </button>
          <button type="button" onClick={()=>setMobileMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-gray-300 active:bg-white/10" aria-label={t("common.close")}><X className="h-5 w-5"/></button>
        </div>
        <div className="touch-scroll max-h-[calc(82dvh-5rem)] px-3 py-3">
          <div className="grid grid-cols-3 gap-2">
            {mobileSecondary.map(item => <button key={item.tab} type="button" onClick={()=>selectMobileTab(item.tab)} className={`tap-feedback flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center ${activeTab===item.tab?"border-primary-500/70 bg-primary-500/15 text-primary-300":"border-navy-600 bg-navy-700/70 text-gray-200"}`}><span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span><span className="text-[11px] font-semibold leading-tight">{item.label}</span></button>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-navy-700 pt-3">
            <button type="button" onClick={()=>{setMobileMenuOpen(false);onNavigateSettings();}} className="tap-feedback flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-3 py-3 text-sm font-semibold"><Settings className="h-5 w-5"/>{t("dashboard.settings")}</button>
            <button type="button" onClick={()=>{setMobileMenuOpen(false);onExitClick();}} className="tap-feedback flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-3 py-3 text-sm font-semibold"><LogOut className="h-5 w-5"/>{t("dashboard.exitToMenu")}</button>
          </div>
        </div>
      </section>
    </div>}

    <nav className="fixed inset-x-0 bottom-0 z-50 flex min-h-[64px] items-stretch justify-around border-t border-navy-700 bg-navy-800/98 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-8px_30px_rgba(0,0,0,.22)] backdrop-blur md:hidden" aria-label="Career navigation">
      {primaryMobile.map(item => <button key={item.tab} type="button" onClick={()=>selectMobileTab(item.tab)} className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 active:bg-white/10 ${activeTab===item.tab?"text-primary-400":"text-gray-400"}`} aria-label={item.label}><span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span><span className="max-w-full truncate text-[10px] font-semibold">{item.label}</span>{item.badge&&<span className="absolute right-[18%] top-1 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{item.badge}</span>}</button>)}
      <button type="button" onClick={()=>setMobileMenuOpen(true)} className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 active:bg-white/10 ${mobileMenuOpen||mobileSecondary.some(item=>item.tab===activeTab)?"text-primary-400":"text-gray-400"}`} aria-label="More"><Menu className="h-5 w-5"/><span className="max-w-full truncate text-[10px] font-semibold">More</span></button>
    </nav>
  </>;
}