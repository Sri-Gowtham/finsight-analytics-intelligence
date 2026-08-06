import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FlaskConical,
  Send,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks, useScenarioRuns } from "@/lib/queries";
import { runWhatIfChat } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pct, quarterLabel } from "@/lib/format";
import {
  ChartPanel,
  ChartSkeleton,
  ComparisonBarChart,
  GaugeChart,
  TrendAreaChart,
  TrendLineChart,
} from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Bank } from "@/lib/types";

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
          "Stress-test an NSE-listed bank: change a metric hypothetically and model the AI-estimated impact.",
      },
      { property: "og:title", content: "What-If Scenario Analysis — FinSight" },
      {
        property: "og:description",
        content: "Model hypothetical metric changes and see AI-estimated impact.",
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

const ALLOWED_METRICS = [
  { value: "NIM", label: "Net Interest Margin" },
  { value: "NPA_percent", label: "NPA %" },
  { value: "CAR", label: "Capital Adequacy" },
  { value: "loan_growth", label: "Loan Growth" },
];

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

function getMetricValue(bank: Bank, metricName: string): number {
  switch (metricName) {
    case "NIM": return bank.latest.nim;
    case "NPA_percent": return bank.latest.gnpa;
    case "CAR": return bank.latest.car;
    case "loan_growth": return 0;
    default: return 0;
  }
}

function ScenarioPage() {
  const { symbol } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useBanks();
  const scenarioRuns = useScenarioRuns(user?.id ?? "");

  // Input state
  const [metricName, setMetricName] = useState("NIM");
  const [hypotheticalValue, setHypotheticalValue] = useState<number>(0);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");

  // Scenario result state
  const [scenarioResult, setScenarioResult] = useState<{
    insight: string;
    scenario_id: number;
    currentValue: number;
    hypotheticalValue: number;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [riskScore, setRiskScore] = useState(50);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const bank = (data ?? []).find((b) => b.symbol === symbol) ?? data?.[0];

  // Set initial values when bank changes
  useEffect(() => {
    if (bank) {
      const currentVal = getMetricValue(bank, metricName);
      setHypotheticalValue(currentVal);
      if (bank.history.length > 0) {
        const lastQuarter = bank.history[bank.history.length - 1];
        if (lastQuarter) {
          setSelectedQuarter(lastQuarter.quarter);
        }
      }
    }
  }, [bank?.symbol, metricName]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Keyboard shortcut: Ctrl+Enter = Run Scenario
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        void handleRunScenario();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bank, metricName, hypotheticalValue]);

  const currentValue = bank ? getMetricValue(bank, metricName) : 0;

  const handleRunScenario = useCallback(async () => {
    if (!bank || isRunning) return;
    setIsRunning(true);

    // Find company_id from the banks data
    // The backend expects company_id (number), we derive it from the symbol
    // Since listBanks maps companies, we need to get the company_id
    // For now, we use a simple approach — call the whatif endpoint with company data
    try {
      // Fetch companies to get the ID
      const companiesRes = await fetch(
        `${import.meta.env['VITE_API_URL'] || ""}/api/companies`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("finsight:token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const companiesData = await companiesRes.json();
      const companies = Array.isArray(companiesData) ? companiesData : (companiesData.companies ?? []);
      const company = companies.find((c: { ticker: string }) => c.ticker === bank.symbol);
      if (!company) throw new Error("Company not found");

      const result = await runWhatIfChat(company.company_id, metricName, hypotheticalValue, "");

      // Compute risk score from delta
      const delta = Math.abs(hypotheticalValue - currentValue);
      const score = Math.min(100, Math.max(0, Math.round(40 + delta * 8)));
      setRiskScore(score);

      setScenarioResult({
        insight: result.insight,
        scenario_id: result.scenario_id,
        currentValue,
        hypotheticalValue,
      });

      // Pre-populate chat with AI result
      setChatMessages([
        {
          role: "assistant",
          content: result.insight,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      toast.error("Failed to run scenario. Please try again.");
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  }, [bank, metricName, hypotheticalValue, currentValue, isRunning]);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || !bank || isTyping) return;
    const question = chatInput.trim();
    setChatInput("");

    // Add user message
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: question, timestamp: Date.now() },
    ]);

    setIsTyping(true);
    try {
      const companiesRes = await fetch(
        `${import.meta.env['VITE_API_URL'] || ""}/api/companies`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("finsight:token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const companiesData = await companiesRes.json();
      const companies = Array.isArray(companiesData) ? companiesData : (companiesData.companies ?? []);
      const company = companies.find((c: { ticker: string }) => c.ticker === bank.symbol);
      if (!company) throw new Error("Company not found");

      const result = await runWhatIfChat(
        company.company_id,
        metricName,
        hypotheticalValue,
        question,
      );

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.insight, timestamp: Date.now() },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I was unable to process your question. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [chatInput, bank, metricName, hypotheticalValue, isTyping]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (isPending || !bank) return <LoadingState rows={4} />;

  // Build chart data for center panel
  const comparisonData = [
    { name: metricName, Current: currentValue, Projected: hypotheticalValue },
  ];

  // Impact delta over quarters
  const impactDelta = bank.history.map((p) => {
    const baseVal = getMetricValue(bank, metricName);
    const delta = hypotheticalValue - baseVal;
    const original = metricName === "NIM" ? p.nim : metricName === "NPA_percent" ? p.gnpa : metricName === "CAR" ? p.car : 0;
    return {
      quarter: p.quarter,
      baseline: original,
      projected: original + delta,
      delta,
    };
  });

  // Parse inline charts from chat messages
  function renderChatContent(content: string) {
    // Check for ```chart ... ``` blocks
    const chartRegex = /```chart\n([\s\S]*?)```/g;
    const parts: Array<{ type: "text" | "chart"; content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = chartRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: "chart", content: match[1] ?? "" });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    return parts.map((part, i) => {
      if (part.type === "chart") {
        try {
          const chartData = JSON.parse(part.content);
          if (Array.isArray(chartData) && chartData.length > 0) {
            const keys = Object.keys(chartData[0]).filter((k) => k !== "quarter" && k !== "label");
            return (
              <div key={i} className="my-2 rounded-lg border border-border p-2">
                <TrendLineChart
                  data={chartData}
                  series={keys.map((k) => ({ key: k, label: k }))}
                  height={160}
                  formatQuarters
                />
              </div>
            );
          }
        } catch {
          // If parsing fails, render as code block
        }
        return (
          <pre key={i} className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
            <code>{part.content}</code>
          </pre>
        );
      }
      return (
        <div key={i} className="prose prose-sm dark:prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>
        </div>
      );
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Scenario lab"
        title="What-if scenario analysis"
        description="Change a metric hypothetically and see the AI-estimated impact on bank performance."
        actions={
          <>
            <Select
              value={bank.symbol}
              onValueChange={(value) => {
                setScenarioResult(null);
                setChatMessages([]);
                navigate({ to: ".", search: { symbol: value } });
              }}
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
              <Link to="/scenarios/history">
                <History className="size-4" aria-hidden />
                History
              </Link>
            </Button>
          </>
        }
      />

      {/* ── 3-Panel Workspace ── */}
      <div className="flex gap-4 items-start" style={{ minHeight: "calc(100vh - 200px)" }}>

        {/* ── LEFT PANEL: Inputs (~280px) ── */}
        <aside className="w-[280px] shrink-0 space-y-4 sticky top-4">
          <section className="surface space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4 text-primary" aria-hidden />
              Scenario inputs
            </h2>

            {/* Metric selector */}
            <div className="space-y-1.5">
              <Label htmlFor="metric-select">Metric</Label>
              <Select value={metricName} onValueChange={(v) => {
                setMetricName(v);
                setScenarioResult(null);
                setChatMessages([]);
              }}>
                <SelectTrigger id="metric-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_METRICS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current value (read-only) */}
            <div className="space-y-1.5">
              <Label>Current Value</Label>
              <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-semibold tabular-nums">
                {currentValue.toFixed(2)}
              </div>
            </div>

            {/* Hypothetical value */}
            <div className="space-y-1.5">
              <Label htmlFor="hyp-value">Hypothetical Value</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setHypotheticalValue((v) => Math.round((v - 0.5) * 100) / 100)}
                  aria-label="Decrease value"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  id="hyp-value"
                  type="number"
                  step="0.1"
                  value={hypotheticalValue}
                  onChange={(e) => setHypotheticalValue(Number(e.target.value))}
                  className="text-center font-semibold tabular-nums"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setHypotheticalValue((v) => Math.round((v + 0.5) * 100) / 100)}
                  aria-label="Increase value"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {/* Quarter selector */}
            <div className="space-y-1.5">
              <Label htmlFor="quarter-select">Quarter</Label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger id="quarter-select">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {bank.history.map((p) => (
                    <SelectItem key={p.quarter} value={p.quarter}>
                      {quarterLabel(p.quarter)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Run Scenario */}
            <Button
              className="w-full"
              onClick={() => void handleRunScenario()}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Running…
                </>
              ) : (
                <>
                  <FlaskConical className="size-4" aria-hidden />
                  Run Scenario
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">Ctrl+Enter</kbd> to run
            </p>
          </section>

          {/* Scenario History */}
          <section className="surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Recent Scenarios
            </h3>
            {scenarioRuns.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-8 rounded-md" />
                <Skeleton className="h-8 rounded-md" />
              </div>
            ) : (scenarioRuns.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No saved scenarios yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {(scenarioRuns.data ?? []).slice(0, 8).map((run) => (
                  <li key={run.id}>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                      onClick={() => {
                        navigate({ to: ".", search: { symbol: run.bankSymbol } });
                      }}
                    >
                      <span className="font-medium">{run.name}</span>
                      <span className="block text-muted-foreground truncate">
                        {run.bankSymbol} · {run.result.verdict.slice(0, 40)}…
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        {/* ── CENTER PANEL: Charts (flex-1) ── */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Compliance Disclaimer — ALWAYS visible */}
          <div className="disclaimer-banner flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 text-warning mt-0.5" aria-hidden />
            <p>This is a scenario estimate, not a prediction or guarantee. The analysis is for informational purposes only and should not be construed as investment advice.</p>
          </div>

          {scenarioResult ? (
            <>
              {/* Current vs Projected */}
              <ChartPanel title="Current vs Projected" subtitle={`${ALLOWED_METRICS.find(m => m.value === metricName)?.label ?? metricName} comparison`}>
                <ComparisonBarChart
                  data={comparisonData}
                  series={[
                    { key: "Current", label: "Current", color: "var(--color-chart-2)" },
                    { key: "Projected", label: "Projected", color: "var(--color-chart-1)" },
                  ]}
                  height={260}
                />
              </ChartPanel>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Impact delta over quarters */}
                <ChartPanel title="Impact Delta" subtitle="Baseline vs projected across quarters">
                  <TrendAreaChart
                    data={impactDelta}
                    series={[
                      { key: "baseline", label: "Baseline" },
                      { key: "projected", label: "Projected" },
                    ]}
                    height={260}
                    formatQuarters
                  />
                </ChartPanel>

                {/* Gauge Chart: Risk Score */}
                <ChartPanel title="Risk Assessment" subtitle="Composite risk score">
                  <GaugeChart score={riskScore} height={260} />
                  <div className="mt-2 text-center">
                    <Badge
                      className={
                        riskScore < 40
                          ? "border-transparent bg-success-soft text-primary"
                          : riskScore < 62
                            ? "border-transparent bg-warning-soft text-warning"
                            : "border-transparent bg-destructive/10 text-destructive"
                      }
                    >
                      {riskScore < 40 ? "Low Risk" : riskScore < 62 ? "Moderate Risk" : "High Risk"}
                    </Badge>
                  </div>
                </ChartPanel>
              </div>
            </>
          ) : (
            <div className="surface flex flex-col items-center gap-4 p-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <FlaskConical className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <h3 className="font-semibold">No scenario running</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Configure your scenario inputs in the left panel and click "Run Scenario" to see the AI-estimated impact analysis.
              </p>
            </div>
          )}
        </main>

        {/* ── RIGHT PANEL: AI Chat (~360px) ── */}
        <aside className="w-[360px] shrink-0 sticky top-4">
          <section className="surface flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b border-border p-4">
              <Sparkles className="size-4 text-ai" aria-hidden />
              <h2 className="text-sm font-semibold">FinSight AI Analyst</h2>
              <Badge variant="outline" className="ml-auto text-[10px] font-mono">GPT-4o</Badge>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {chatMessages.length === 0 && !scenarioResult && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Sparkles className="size-6 mx-auto mb-2 text-ai" aria-hidden />
                    <p>Run a scenario to start a conversation with the AI analyst.</p>
                    <p className="mt-1 text-xs">Ask follow-up questions about the impact analysis.</p>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div
                    key={`${msg.timestamp}-${i}`}
                    className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                      {msg.role === "user" ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <div className="text-sm leading-relaxed">
                          {renderChatContent(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-ai">
                      <div className="typing-indicator">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Chat input */}
            <div className="border-t border-border p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendChat();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={scenarioResult ? "Ask a follow-up question…" : "Run a scenario first…"}
                  disabled={!scenarioResult || isTyping}
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!chatInput.trim() || !scenarioResult || isTyping}
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </form>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                AI responses are scoped to financial analysis only.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
