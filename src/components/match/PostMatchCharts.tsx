import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useChartTheme } from "../ui/charts/chartTheme";

interface PossessionDonutProps { homePct:number; awayPct:number; homeTeamName:string; awayTeamName:string; homeColor:string; awayColor:string; label:string; }
export function PossessionDonut({homePct,awayPct,homeTeamName,awayTeamName,homeColor,awayColor,label}:PossessionDonutProps){
 const theme=useChartTheme(); const total=homePct+awayPct; const normalizedHome=total>0?(homePct/total)*100:50; const roundedHome=Math.round(normalizedHome); const roundedAway=100-roundedHome;
 const data=[{name:homeTeamName,value:roundedHome},{name:awayTeamName,value:roundedAway}];
 return <div className="flex w-full flex-col items-center gap-2" aria-label={`${label}: ${homeTeamName} ${roundedHome}%, ${awayTeamName} ${roundedAway}%`}>
  <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
  <div className="relative h-24 w-24 sm:h-[88px] sm:w-[88px]">
   <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius="58%" outerRadius="88%" dataKey="value" strokeWidth={0}><Cell fill={homeColor}/><Cell fill={awayColor}/></Pie><Tooltip contentStyle={{backgroundColor:theme.tooltipBg,border:`1px solid ${theme.tooltipBorder}`,borderRadius:8,fontSize:12,color:theme.tooltipText}} formatter={(value,name)=>[`${value??0}%`,String(name??"")]}/></PieChart></ResponsiveContainer>
   <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-heading text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">{roundedHome}%</span></div>
  </div>
  <div className="grid w-full max-w-xs grid-cols-2 gap-2 text-xs font-heading font-bold"><span className="truncate text-right" style={{color:homeColor}}>{homeTeamName} {roundedHome}%</span><span className="truncate" style={{color:awayColor}}>{awayTeamName} {roundedAway}%</span></div>
 </div>;
}
