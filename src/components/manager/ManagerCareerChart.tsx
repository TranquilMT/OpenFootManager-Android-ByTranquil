import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartTheme } from "../ui/charts/chartTheme";
import { ChartContainer } from "../ui/charts/ChartContainer";

interface CareerEntry {
  team_name: string;
  wins: number;
  draws: number;
  losses: number;
}

interface ManagerCareerChartProps {
  history: CareerEntry[];
  wonLabel: string;
  drawnLabel: string;
  lostLabel: string;
}

export function ManagerCareerChart({
  history,
  wonLabel,
  drawnLabel,
  lostLabel,
}: ManagerCareerChartProps) {
  const theme = useChartTheme();

  if (
    history.length === 0 ||
    history.every((entry) => entry.wins + entry.draws + entry.losses === 0)
  ) {
    return <ChartContainer isEmpty height={160} />;
  }

  const data = history.map((entry, index) => ({
    club:
      history.filter((spell) => spell.team_name === entry.team_name).length > 1
        ? `${entry.team_name.slice(0, 7)}… ${history.slice(0, index + 1).filter((spell) => spell.team_name === entry.team_name).length}`
        : entry.team_name.length > 10
          ? `${entry.team_name.slice(0, 10)}…`
          : entry.team_name,
    won: entry.wins,
    drawn: entry.draws,
    lost: entry.losses,
    fullName: entry.team_name,
  }));

  return (
    <div className="overflow-x-auto">
      <div
        className={
          history.length > 12
            ? "min-w-[80rem]"
            : history.length > 7
              ? "min-w-[56rem]"
              : "min-w-[40rem]"
        }
      >
        <ChartContainer height={160}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} vertical={false} />
              <XAxis
                dataKey="club"
                tick={{ fill: theme.axisColor, fontSize: 9, fontFamily: "var(--font-heading)" }}
                axisLine={{ stroke: theme.gridColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: theme.axisColor, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.tooltipBg,
                  border: `1px solid ${theme.tooltipBorder}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: theme.tooltipText,
                }}
                labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName ?? _label}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-heading)" }} />
              <Bar
                isAnimationActive={theme.animate}
                dataKey="won"
                stackId="a"
                fill={theme.success}
                name={wonLabel}
              />
              <Bar
                isAnimationActive={theme.animate}
                dataKey="drawn"
                stackId="a"
                fill={theme.axisColor}
                name={drawnLabel}
              />
              <Bar
                isAnimationActive={theme.animate}
                dataKey="lost"
                stackId="a"
                fill={theme.danger}
                name={lostLabel}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
