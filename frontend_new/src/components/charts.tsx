import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "var(--shadow-card)",
    color: "var(--color-card-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontWeight: 600 },
};

export const SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export interface SeriesDef {
  key: string;
  label: string;
  color?: string | undefined;
}

export function TrendAreaChart({
  data,
  series,
  xKey = "quarter",
  height = 260,
  unit,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string | undefined;
  height?: number | undefined;
  unit?: string | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient id={`grad-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                stopOpacity={0.32}
              />
              <stop
                offset="95%"
                stopColor={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                stopOpacity={0.02}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} {...(unit ? { unit } : {})} />
        <Tooltip {...tooltipStyle} />
        {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({
  data,
  series,
  xKey = "quarter",
  height = 260,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string | undefined;
  height?: number | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBarChart({
  data,
  series,
  xKey = "name",
  height = 300,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string | undefined;
  height?: number | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} interval={0} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            radius={[6, 6, 0, 0]}
            fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
