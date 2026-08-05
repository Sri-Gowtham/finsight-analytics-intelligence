import type { ReactNode } from "react";
import { Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function StatCard({
  label,
  value,
  hint,
  trend,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  trend?: number | undefined;
  tone?: "default" | "ai" | "cfo" | undefined;
  icon?: ReactNode | undefined;
}) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "ai" && "bg-ai-soft text-ai",
              tone === "cfo" && "bg-cfo-soft text-cfo-foreground",
              tone === "default" && "bg-secondary text-secondary-foreground",
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {TrendIcon ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold",
              trend! > 0 ? "text-primary" : trend! < 0 ? "text-destructive" : "",
            )}
          >
            <TrendIcon className="size-3.5" aria-hidden />
            {trend! > 0 ? "+" : ""}
            {trend!.toFixed(2)}%
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  );
}

export function AiBadge({ label = "AI generated" }: { label?: string }) {
  return (
    <Badge className="gap-1 border-transparent bg-ai-soft text-ai hover:bg-ai-soft">
      <Sparkles className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const p = Math.round(value * 100);
  return (
    <div className="w-full max-w-[190px]">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Model confidence</span>
        <span className="font-semibold tabular-nums text-foreground">{p}%</span>
      </div>
      <Progress
        value={p}
        className="mt-1.5 h-1.5"
        aria-label={`Model confidence ${p} percent`}
      />
    </div>
  );
}

export function DirectionBadge({ direction }: { direction: "positive" | "negative" | "neutral" }) {
  const map = {
    positive: { text: "Constructive", cls: "bg-success-soft text-primary" },
    negative: { text: "Cautionary", cls: "bg-destructive/10 text-destructive" },
    neutral: { text: "Neutral", cls: "bg-muted text-muted-foreground" },
  } as const;
  const item = map[direction];
  return (
    <Badge className={cn("border-transparent hover:opacity-90", item.cls)}>{item.text}</Badge>
  );
}

export function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { text: "Pending review", cls: "bg-warning-soft text-warning" },
    approved: { text: "Approved", cls: "bg-success-soft text-primary" },
    rejected: { text: "Rejected", cls: "bg-destructive/10 text-destructive" },
  } as const;
  return (
    <Badge className={cn("border-transparent hover:opacity-90", map[status].cls)}>
      {map[status].text}
    </Badge>
  );
}
