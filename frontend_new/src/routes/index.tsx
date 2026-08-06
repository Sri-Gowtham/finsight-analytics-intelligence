import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileCheck2,
  FlaskConical,
  GitCompareArrows,
  Globe,
  Lock,
  Mail,
  MapPin,
  Rewind,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/finsight-hero.jpg";

export const Route = createFileRoute("/")(  {
    head: () => ({
      meta: [
        { title: "FinSight — AI Financial Intelligence for NSE-Listed Banks" },
        {
          name: "description",
          content:
            "FinSight gives consultancy and advisory firms auditable AI insights on NSE-listed Indian banks: peer comparison, historical replay, what-if scenarios and CFO approval workflows.",
        },
        { property: "og:title", content: "FinSight — AI Financial Intelligence Platform" },
        {
          property: "og:description",
          content:
            "Compliance-first AI research on Indian banks, with a verifiable source trail behind every insight.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    }),
    component: Landing,
  });

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Transparent AI insights",
    body: "Every generated insight carries a step-by-step trail with the exact source metrics used, so analysts can verify before it reaches a client.",
  },
  {
    icon: GitCompareArrows,
    title: "Peer comparison",
    body: "Benchmark margins, asset quality, capital and returns across private, public and small finance banks in a single view.",
  },
  {
    icon: Rewind,
    title: "Historical replay",
    body: "Step quarter by quarter through eight reported periods to see how a thesis would have evolved in real time.",
  },
  {
    icon: FlaskConical,
    title: "What-if scenarios",
    body: "Shock the repo rate, slippages, credit growth or deposit mix and see modelled impact on margin, profit, capital and risk.",
  },
  {
    icon: FileCheck2,
    title: "CFO approval workflow",
    body: "Executive summaries reach the CFO without raw metrics or model internals. Nothing circulates until it is approved.",
  },
  {
    icon: ShieldCheck,
    title: "Provisioned access only",
    body: "No public signup. Administrators provision Analyst, CFO and Admin accounts with strictly separated capabilities.",
  },
];

const WHY_CHOOSE = [
  {
    icon: BrainCircuit,
    title: "AI-Powered Financial Intelligence",
    body: "Generate explainable insights from real banking data.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Banking Analytics",
    body: "Track financial performance using live market data and financial statements.",
  },
  {
    icon: Users,
    title: "Portfolio-Based Analysis",
    body: "Analyse banks based on individual client portfolios.",
  },
  {
    icon: FlaskConical,
    title: "Scenario Simulation",
    body: "Run What-If simulations before making recommendations.",
  },
  {
    icon: FileCheck2,
    title: "Executive Approval Workflow",
    body: "Maintain a complete approval trail from Analyst to CFO.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    body: "Role-based access control, audit logs and secure authentication.",
  },
];

const PLANS = [
  {
    name: "Starter",
    subtitle: "For Students & Demo",
    price: "Free",
    priceSub: null as string | null,
    cta: "Get Started",
    highlighted: false,
    features: ["Demo Dataset", "Limited Banks", "Dashboard Access"],
  },
  {
    name: "Professional",
    subtitle: "For Financial Consultants",
    price: "\u20b9999",
    priceSub: "/month" as string | null,
    cta: "Start Free Trial",
    highlighted: true,
    features: [
      "Unlimited Analysis",
      "Portfolio Management",
      "AI Insights",
      "What-if Analysis",
      "Historical Replay",
    ],
  },
  {
    name: "Enterprise",
    subtitle: "For Organizations",
    price: "Contact Us",
    priceSub: null as string | null,
    cta: "Talk to Sales",
    highlighted: false,
    features: [
      "Unlimited Users",
      "Custom Integrations",
      "Dedicated Support",
      "Audit Logs",
      "API Access",
    ],
  },
];

const CONTACT_CARDS = [
  { icon: Mail, label: "Email", value: "support@finsight.ai", href: "mailto:support@finsight.ai" },
  { icon: Zap, label: "Sales", value: "sales@finsight.ai", href: "mailto:sales@finsight.ai" },
  {
    icon: Globe,
    label: "Business",
    value: "contact@finsight.ai",
    href: "mailto:contact@finsight.ai",
  },
  { icon: MapPin, label: "Location", value: "India", href: null as string | null },
  {
    icon: Clock,
    label: "Working Hours",
    value: "Monday - Friday  9:00 AM - 6:00 PM",
    href: null as string | null,
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpeg"
              alt="FinSight Financial Intelligence"
              className="size-9 rounded-xl object-cover shadow-[var(--shadow-glow)]"
            />
            <span className="leading-tight">
              <span className="block text-base font-bold">FinSight</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Financial Intelligence
              </span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#capabilities">
              Capabilities
            </a>
            <a className="transition-colors hover:text-foreground" href="#why-choose">
              Why FinSight
            </a>
            <a className="transition-colors hover:text-foreground" href="#pricing">
              Pricing
            </a>
            <a className="transition-colors hover:text-foreground" href="#contact">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/get-started">
                Get Started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="space-y-6">
            <Badge className="gap-1 border-transparent bg-ai-soft text-ai hover:bg-ai-soft">
              <Sparkles className="size-3" aria-hidden />
              AI research, fully auditable
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Banking intelligence your{" "}
              <span className="text-gradient-emerald">compliance team</span> can defend
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              FinSight covers NSE-listed Indian banks for consultancy and advisory firms. Analysts
              get depth and a verifiable trail behind every AI insight. CFOs get clean executive
              summaries and an approval gate. Nothing reaches a client unreviewed.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/get-started">
                  Get Started
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign in to workspace</Link>
              </Button>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-4 pt-4">
              {[
                ["12", "NSE banks covered"],
                ["8", "Reported quarters"],
                ["100%", "Insights traceable"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-bold tabular-nums">{value}</dt>
                  <dd className="text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Abstract visualisation of FinSight banking analytics dashboards"
              className="w-full rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
              width={1600}
              height={1100}
              loading="eager"
            />
            <div className="surface absolute -bottom-6 left-4 hidden max-w-[15rem] gap-2 p-4 sm:flex sm:flex-col">
              <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                <CheckCircle2 className="size-4" aria-hidden />
                Insight approved
              </span>
              <p className="text-xs text-muted-foreground">
                CFO cleared 4 of 6 insights this week with full basis on record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section id="capabilities" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Platform capabilities
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Built for the way advisory teams actually work
          </h2>
          <p className="text-sm text-muted-foreground">
            One workspace from raw quarterly filings to a client-ready, approved recommendation.
          </p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <li
              key={item.title}
              className="surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <item.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Why Choose FinSight */}
      <section id="why-choose" className="border-y border-border bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Why Us</p>
            <h2 className="text-3xl font-bold tracking-tight">Why Choose FinSight?</h2>
            <p className="text-sm text-muted-foreground">
              Purpose-built for banking advisory firms, investment teams, and financial consultants.
            </p>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CHOOSE.map((item) => (
              <li
                key={item.title}
                className="surface group flex flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Three Roles */}
      <section id="roles" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">Three roles, strict separation</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            {
              role: "Analyst",
              tone: "border-primary/30",
              points: [
                "Client portfolios and full bank coverage",
                "AI insight trail with source metric IDs",
                "Peer comparison, replay and what-if lab",
              ],
            },
            {
              role: "CFO",
              tone: "border-cfo/50",
              points: [
                "Executive summaries only — no raw metrics",
                "Show Basis in plain business language",
                "Approve or reject with a recorded note",
              ],
            },
            {
              role: "Admin",
              tone: "border-ai/30",
              points: [
                "Provision users and assign roles",
                "Manage client portfolios and mandates",
                "Configure data sources — no insight access",
              ],
            },
          ].map((card) => (
            <div
              key={card.role}
              className={`surface border-t-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] ${card.tone}`}
            >
              <h3 className="text-lg font-bold">{card.role}</h3>
              <ul className="mt-4 space-y-2.5">
                {card.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="pricing" className="border-y border-border bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
            <p className="text-sm text-muted-foreground">
              Start free. Scale when you are ready. Cancel anytime.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-primary bg-card shadow-[var(--shadow-elevated)] ring-2 ring-primary/20"
                    : "border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
                      <Sparkles className="size-3" aria-hidden />
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="flex-1 space-y-5">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    {plan.priceSub && (
                      <span className="mb-1 text-sm text-muted-foreground">{plan.priceSub}</span>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Button
                    asChild
                    size="lg"
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link to="/get-started">
                      {plan.cta}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance CTA */}
      <section id="compliance" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="surface flex flex-col items-start gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Lock className="size-4" aria-hidden />
              Compliance first
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Access is provisioned, never self-served
            </h2>
            <p className="text-sm text-muted-foreground">
              FinSight has no public signup. Your administrator issues credentials, assigns roles
              and controls which client portfolios each analyst can see. Every approval decision is
              stored with its reviewer, timestamp and note.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/login">
              Go to sign in
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-y border-border bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</p>
            <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
            <p className="text-sm text-muted-foreground">
              We would love to hear from you. Reach out through any of the channels below.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CONTACT_CARDS.map((card) => (
              <div
                key={card.label}
                className="surface group flex flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <card.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  {card.href ? (
                    <a
                      href={card.href}
                      className="mt-1 block text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {card.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-foreground">{card.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" variant="outline">
              <a href="mailto:support@finsight.ai">
                <Mail className="size-4" aria-hidden />
                Send us an Email
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpeg"
                  alt="FinSight Financial Intelligence"
                  className="size-9 rounded-xl object-cover shadow-[var(--shadow-glow)]"
                />
                <span className="leading-tight">
                  <span className="block text-base font-bold">FinSight</span>
                  <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Financial Intelligence
                  </span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Demonstration environment with modelled data. Not investment advice. Figures are
                illustrative and do not represent live NSE market data.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Home", href: "#" },
                  { label: "Capabilities", href: "#capabilities" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Contact", href: "#contact" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms & Conditions", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Social</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "LinkedIn", href: "#" },
                  { label: "GitHub", href: "#" },
                  { label: "X (Twitter)", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-6">
            <p className="text-center text-xs text-muted-foreground">
              &copy; 2026 FinSight Financial Intelligence. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
