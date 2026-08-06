import { useRef, useCallback, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pct, quarterLabel } from "@/lib/format";

/* ---------- shared constants ---------- */

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
    backdropFilter: "blur(12px)",
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

/* ---------- financial tooltip formatter ---------- */

function fmtTooltipValue(value: number | string, name: string): [string, string] {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return [String(value), name];
  // Detect percentage-like metrics
  const pctKeys = ["nim", "gnpa", "nnpa", "car", "casa", "roa", "roe", "profitMargin", "revenueGrowth"];
  const key = name.toLowerCase().replace(/\s+/g, "");
  if (pctKeys.some((k) => key.includes(k))) return [pct(n), name];
  if (Math.abs(n) >= 1000) return [`₹${n.toLocaleString("en-IN")} Cr`, name];
  return [n.toFixed(2), name];
}

function quarterTickFormatter(val: string): string {
  return quarterLabel(val);
}

/** Identity formatter — avoids passing `undefined` which breaks exactOptionalPropertyTypes */
const identityFormatter = (val: string) => String(val);
const identityLabelFormatter = (label: string) => String(label);

/* ---------- Export PNG ---------- */

export function ExportPngButton({ containerRef, filename = "chart" }: { containerRef: React.RefObject<HTMLDivElement | null>; filename?: string }) {
  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [containerRef, filename]);

  return (
    <Button variant="ghost" size="icon" onClick={handleExport} aria-label="Export chart as PNG" className="size-7 text-muted-foreground hover:text-foreground">
      <Download className="size-3.5" aria-hidden />
    </Button>
  );
}

/* ---------- Chart Skeleton ---------- */

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-3" style={{ height }}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  );
}

/* ---------- Chart Panel Wrapper ---------- */

export function ChartPanel({
  title,
  subtitle,
  children,
  height = 320,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <ExportPngButton containerRef={ref} filename={title.toLowerCase().replace(/\s+/g, "-")} />
      </div>
      <div ref={ref} className="mt-4" style={{ minHeight: height }}>
        {children}
      </div>
    </section>
  );
}

/* ---------- TrendAreaChart ---------- */

export function TrendAreaChart({
  data,
  series,
  xKey = "quarter",
  height = 260,
  unit,
  formatQuarters = false,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string | undefined;
  height?: number | undefined;
  unit?: string | undefined;
  formatQuarters?: boolean;
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
        <XAxis dataKey={xKey} {...axis} tickFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
        <YAxis {...axis} {...(unit ? { unit } : {})} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltipValue} labelFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
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
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- TrendLineChart ---------- */

export function TrendLineChart({
  data,
  series,
  xKey = "quarter",
  height = 260,
  formatQuarters = false,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string | undefined;
  height?: number | undefined;
  formatQuarters?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} tickFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltipValue} labelFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
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
            activeDot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={600}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------- ComparisonBarChart ---------- */

export function ComparisonBarChart({
  data,
  series,
  xKey = "name",
  height = 300,
  formatQuarters = false,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string | undefined;
  height?: number | undefined;
  formatQuarters?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} interval={0} tickFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltipValue} labelFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            radius={[6, 6, 0, 0]}
            fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            isAnimationActive={true}
            animationDuration={500}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- HorizontalBarChart (layout="vertical") ---------- */

export function HorizontalBarChart({
  data,
  series,
  yKey = "name",
  height = 300,
}: {
  data: unknown[];
  series: SeriesDef[];
  yKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" {...axis} />
        <YAxis type="category" dataKey={yKey} {...axis} width={80} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltipValue} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            radius={[0, 6, 6, 0]}
            fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            isAnimationActive={true}
            animationDuration={500}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- GradientAreaChart (multi-bank revenue growth) ---------- */

export function GradientAreaChart({
  data,
  series,
  xKey = "quarter",
  height = 300,
  formatQuarters = false,
}: {
  data: unknown[];
  series: SeriesDef[];
  xKey?: string;
  height?: number;
  formatQuarters?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? SERIES_COLORS[i % SERIES_COLORS.length];
            return (
              <linearGradient id={`revgrad-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} tickFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltipValue} labelFormatter={formatQuarters ? quarterTickFormatter : identityFormatter} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            fill={`url(#revgrad-${s.key})`}
            isAnimationActive={true}
            animationDuration={600}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- RadarComparisonChart ---------- */

export function RadarComparisonChart({
  data,
  series,
  metricKey = "metric",
  height = 340,
}: {
  data: unknown[];
  series: SeriesDef[];
  metricKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey={metricKey} {...axis} />
        <PolarRadiusAxis {...axis} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltipValue} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Radar
            key={s.key}
            name={s.label}
            dataKey={s.key}
            stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={600}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ---------- GaugeChart (RadialBarChart 0-100) ---------- */

const GAUGE_COLORS = [
  { threshold: 40, color: "var(--color-chart-1)" },   // green — low risk
  { threshold: 62, color: "var(--color-chart-3)" },   // gold — moderate
  { threshold: 100, color: "var(--color-chart-5)" },  // red — high risk
];

function getGaugeColor(score: number): string {
  for (const { threshold, color } of GAUGE_COLORS) {
    if (score <= threshold) return color;
  }
  return GAUGE_COLORS[GAUGE_COLORS.length - 1]!.color;
}

export function GaugeChart({
  score,
  label = "Risk Score",
  height = 220,
}: {
  score: number;
  label?: string;
  height?: number;
}) {
  const color = getGaugeColor(score);
  const data = [{ name: label, value: score, fill: color }];
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          barSize={14}
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
