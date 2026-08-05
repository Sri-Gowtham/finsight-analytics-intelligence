import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks, useSaveScenarioRun } from "@/lib/queries";
import { baselineResult, computeScenario } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pct } from "@/lib/format";
import { ComparisonBarChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScenarioInput } from "@/lib/types";

export const Route = createFileRoute("/_app/scenarios/")({
  validateSearch: (search: Record<string, unknown>) => ({
    symbol: typeof search["symbol"] === "string" ? (search["symbol"] as string) : "HDFCBANK",
  }),
  head: () => ({
    meta: [
      { title: "What-If Scenario Analysis — FinSight" },
      {
        name: "description",
        content:
          "Stress-test an NSE-listed bank: shock the repo rate, slippages, credit growth and deposit mix, and model the impact on margin, profit, capital and risk.",
      },
      { property: "og:title", content: "What-If Scenario Analysis — FinSight" },
      {
        property: "og:description",
        content: "Model rate, credit and funding shocks against a bank's latest reported quarter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <ScenarioPage />
    </RoleGuard>
  ),
});

const DEFAULTS: ScenarioInput = {
  repoRateDeltaBps: 0,
  gnpaDeltaPct: 0,
  creditGrowthPct: 0,
  casaDeltaPct: 0,
};

const CONTROLS: {
  key: keyof ScenarioInput;
  label: string;
  help: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}[] = [
  {
    key: "repoRateDeltaBps",
    label: "Repo rate change",
    help: "Policy rate shock passed through to lending and deposit repricing.",
    min: -200,
    max: 200,
    step: 25,
    suffix: "bps",
  },
  {
    key: "gnpaDeltaPct",
    label: "Gross NPA change",
    help: "Additional slippages as a percentage-point change on the reported ratio.",
    min: -2,
    max: 4,
    step: 0.1,
    suffix: "pp",
  },
  {
    key: "creditGrowthPct",
    label: "Credit growth",
    help: "Incremental annual advances growth versus the reported base.",
    min: -10,
    max: 30,
    step: 1,
    suffix: "%",
  },
  {
    key: "casaDeltaPct",
    label: "CASA mix change",
    help: "Shift in low-cost deposit share, in percentage points.",
    min: -8,
    max: 8,
    step: 0.5,
    suffix: "pp",
  },
];

function ScenarioPage() {
  const { symbol } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useBanks();
  const [inputs, setInputs] = useState<ScenarioInput>(DEFAULTS);
  const [name, setName] = useState("");
  const save = useSaveScenarioRun(user?.id ?? "");

  const bank = (data ?? []).find((b) => b.symbol === symbol) ?? data?.[0];

  const { baseline, result } = useMemo(() => {
    if (!bank) return { baseline: null, result: null };
    return { baseline: baselineResult(bank), result: computeScenario(bank, inputs) };
  }, [bank, inputs]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (isPending || !bank || !baseline || !result) return <LoadingState rows={4} />;

  const chartData = [
    { name: "NIM %", Baseline: baseline.nim, Scenario: result.nim },
    { name: "ROA %", Baseline: baseline.roa, Scenario: result.roa },
    { name: "CAR %", Baseline: baseline.car, Scenario: result.car },
  ];

  const onSave = async () => {
    if (!user) return;
    try {
      await save.mutateAsync({
        bankSymbol: bank.symbol,
        name: name.trim() || `${bank.symbol} stress case`,
        inputs,
        baseline,
        result,
        createdBy: user.id,
      });
      setName("");
      toast.success("Scenario saved to your what-if history");
    } catch {
      toast.error("Could not save this scenario. Please retry.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Scenario lab"
        title="What-if scenario analysis"
        description="Apply macro and credit shocks to the latest reported quarter and see modelled impact before you commit to a recommendation."
        actions={
          <>
            <Select
              value={bank.symbol}
              onValueChange={(value) => navigate({ to: ".", search: { symbol: value } })}
            >
              <SelectTrigger className="w-[210px]" aria-label="Select bank">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(data ?? []).map((b) => (
                  <SelectItem key={b.symbol} value={b.symbol}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" size="sm">
              <Link to="/scenarios/history">History</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="surface space-y-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="size-4 text-primary" aria-hidden />
                Scenario assumptions
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setInputs(DEFAULTS)}>
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </Button>
            </div>

            {CONTROLS.map((control) => (
              <div key={control.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={control.key}>{control.label}</Label>
                  <span className="text-sm font-semibold tabular-nums">
                    {inputs[control.key] > 0 ? "+" : ""}
                    {inputs[control.key]} {control.suffix}
                  </span>
                </div>
                <Slider
                  id={control.key}
                  value={[inputs[control.key]]}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onValueChange={([v]) =>
                    setInputs((prev) => ({ ...prev, [control.key]: v ?? 0 }))
                  }
                  aria-label={control.label}
                />
                <p className="text-xs text-muted-foreground">{control.help}</p>
              </div>
            ))}
          </section>

          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Baseline versus scenario</h2>
            <p className="text-xs text-muted-foreground">
              Modelled outcome for {bank.name}, base period {bank.latest.quarter}
            </p>
            <div className="mt-4">
              <ComparisonBarChart
                data={chartData}
                series={[
                  { key: "Baseline", label: "Baseline" },
                  { key: "Scenario", label: "Scenario" },
                ]}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface space-y-4 p-5">
            <h2 className="text-sm font-semibold">Modelled outcome</h2>
            <dl className="space-y-3">
              {[
                ["Net interest margin", pct(result.nim), pct(baseline.nim)],
                [
                  "Profit after tax",
                  `₹${result.patCr.toLocaleString("en-IN")} Cr`,
                  `₹${baseline.patCr.toLocaleString("en-IN")} Cr`,
                ],
                ["Return on assets", pct(result.roa), pct(baseline.roa)],
                ["Capital adequacy", pct(result.car), pct(baseline.car)],
              ].map(([label, value, base]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-right">
                    <span className="block font-semibold tabular-nums">{value}</span>
                    <span className="block text-xs text-muted-foreground">base {base}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Composite risk score</span>
                <span className="font-semibold tabular-nums">{result.riskScore}/100</span>
              </div>
              <Progress
                value={result.riskScore}
                className="mt-2 h-2"
                aria-label={`Risk score ${result.riskScore} of 100`}
              />
            </div>

            <Badge
              className={
                result.riskScore < 40
                  ? "border-transparent bg-success-soft text-primary"
                  : result.riskScore < 62
                    ? "border-transparent bg-warning-soft text-warning"
                    : "border-transparent bg-destructive/10 text-destructive"
              }
            >
              {result.verdict}
            </Badge>
          </section>

          <section className="surface space-y-3 p-5">
            <Label htmlFor="scenario-name">Save this scenario</Label>
            <Input
              id="scenario-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${bank.symbol} rate shock case`}
            />
            <Button className="w-full" onClick={onSave} disabled={save.isPending}>
              <Save className="size-4" aria-hidden />
              {save.isPending ? "Saving…" : "Save to history"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Saved scenarios are private to your account and retained for audit alongside their
              exact assumptions.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
