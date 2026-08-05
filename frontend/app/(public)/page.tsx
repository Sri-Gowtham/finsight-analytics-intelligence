'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import heroImage from '../../public/finsight-hero.jpg';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  History,
  Sliders,
  ShieldCheck,
  Lock,
  TrendingUp,
  FileCheck,
  Layers,
  Building2,
  PieChart,
  UserCheck,
  Users,
} from 'lucide-react';

export default function PublicPage() {
  return (
    <div className="w-full relative overflow-hidden flex flex-col min-h-screen bg-background text-foreground">
      {/* 1. STICKY NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Logo + Subtitle */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
              FS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <span className="font-bold text-xl tracking-tight text-foreground">FinSight</span>
              <span className="hidden sm:inline-block h-4 w-[1px] bg-border" aria-hidden="true" />
              <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                Financial Intelligence
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a
              href="#capabilities"
              className="transition-colors hover:text-primary focus:outline-none focus:text-primary"
            >
              Capabilities
            </a>
            <a
              href="#roles"
              className="transition-colors hover:text-primary focus:outline-none focus:text-primary"
            >
              Roles
            </a>
            <a
              href="#compliance"
              className="transition-colors hover:text-primary focus:outline-none focus:text-primary"
            >
              Compliance
            </a>
          </nav>

          {/* Right: Client Sign In CTA */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="focus:outline-none">
              <Button
                size="default"
                className="font-semibold px-5 py-2.5 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Client Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* DECORATIVE HERO BACKGROUND LIGHTS (Semantic colors, no inline styles) */}
      <div className="absolute top-10 left-1/4 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 -z-10 w-[30rem] h-[30rem] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* 2. HERO SECTION */}
      <section className="relative px-6 sm:px-8 py-16 lg:py-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <Badge variant="soft" className="mb-6 px-3.5 py-1.5 shadow-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>AI research, fully auditable</span>
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6">
              Banking intelligence your <span className="text-primary">compliance team</span> can defend
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-8 max-w-xl font-normal">
              FinSight converts raw regulatory banking filings and financial metrics into clear, defensible analysis for corporate advisory firms—backed by complete source traceability and multi-tier governance.
            </p>

            {/* Action Buttons Stack */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 mb-12">
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-7 py-6 text-base font-semibold shadow-card hover:shadow-elevated transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
                >
                  <span>Sign in to workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#capabilities" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-7 py-6 text-base font-semibold bg-surface border-border hover:bg-muted text-foreground transition-transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  Explore capabilities
                </Button>
              </a>
            </div>

            {/* Bottom Metrics Row */}
            <div className="w-full pt-8 border-t border-border grid grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">12</span>
                <span className="text-xs sm:text-sm font-medium text-text-secondary mt-1">NSE banks covered</span>
              </div>
              <div className="flex flex-col border-l border-border pl-6">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">8</span>
                <span className="text-xs sm:text-sm font-medium text-text-secondary mt-1">Reported quarters</span>
              </div>
              <div className="flex flex-col border-l border-border pl-6">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">100%</span>
                <span className="text-xs sm:text-sm font-medium text-text-secondary mt-1">Insights traceable</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual & Floating Approval Card */}
          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl lg:max-w-none pb-8 pl-0 sm:pb-12 sm:pl-12">
              {/* Main Rounded Hero Image */}
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-elevated bg-card aspect-[4/3] w-full">
                <img
                  src={heroImage.src}
                  alt="FinSight Financial Intelligence Workspace"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>

              {/* Floating Approval Card */}
              <Card className="absolute -bottom-2 sm:bottom-0 left-2 sm:left-0 z-20 w-80 sm:w-96 p-5 bg-card/95 backdrop-blur-md border border-border shadow-elevated transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-success/15 text-success shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                        Insight approved
                      </span>
                      <Badge variant="soft" className="text-[10px] px-2 py-0.5">VERIFIED</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-0.5 font-normal">
                      CFO cleared 4 of 6 insights this week with full basis on record.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM CAPABILITIES SECTION */}
      <section id="capabilities" className="py-24 sm:py-32 px-6 sm:px-8 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto w-full">
          {/* Section Header */}
          <div className="text-left sm:text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-xs sm:text-sm font-bold tracking-widest text-primary uppercase mb-3 block">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Built for the way advisory teams actually work
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed font-normal">
              Enterprise-grade financial intelligence engineered for regulatory compliance, comprehensive auditability, and clear separation of governance.
            </p>
          </div>

          {/* Six Feature Cards (3 columns grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card className="p-8 flex flex-col justify-between h-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                  Transparent AI insights
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  AI narrates complex financial numbers into plain language without ever inventing figures, altering values, or calculating independently. Complete traceability guaranteed.
                </p>
              </div>
            </Card>

            {/* Card 2 */}
            <Card className="p-8 flex flex-col justify-between h-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                  Peer comparison
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Cross-bank benchmarking across sectors. Easily evaluate net interest margins, non-performing asset trajectories, and capital ratios relative to institutional peers.
                </p>
              </div>
            </Card>

            {/* Card 3 */}
            <Card className="p-8 flex flex-col justify-between h-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                  Historical replay
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Point-in-time forensic views of bank metrics. Understand exactly how balance sheets, asset quality, and financial resilience evolved across reported quarters over time.
                </p>
              </div>
            </Card>

            {/* Card 4 */}
            <Card className="p-8 flex flex-col justify-between h-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                  What-if scenarios
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Interactive parameter modeling for capital stress testing. Projections are rigorously demarcated as simulated analytical estimates, never as investment predictions.
                </p>
              </div>
            </Card>

            {/* Card 5 */}
            <Card className="p-8 flex flex-col justify-between h-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                  CFO approval workflow
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Built-in governance review queue. Every generated analytical insight must be audited and formally cleared by an executive decision-maker before wider distribution.
                </p>
              </div>
            </Card>

            {/* Card 6 */}
            <Card className="p-8 flex flex-col justify-between h-full bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                  Provisioned access only
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Zero self-serve registration or unmonitored access. Every account is strictly provisioned by administrative supervision with enforced immutable role boundaries.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. ROLES SECTION */}
      <section id="roles" className="py-24 sm:py-32 px-6 sm:px-8 max-w-7xl mx-auto w-full border-t border-border">
        <div className="text-left sm:text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Three roles, strict separation
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed font-normal">
            Role-based architecture ensuring rigid boundaries between operational analysis, executive governance clearance, and system administration.
          </p>
        </div>

        {/* Three Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Analyst Card - Green Border */}
          <Card className="p-8 rounded-2xl bg-card border-2 border-primary/40 hover:border-primary shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <Badge variant="soft" className="text-xs">ANALYST ROLE</Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">Analyst</h3>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">
                Full-depth analysis, scenario modeling, and forensic insight creation.
              </p>

              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Generate deep-dive institutional analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Access complete forensic insight source trails</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Run cross-sector Recharts peer comparisons</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Model interactive what-if capital stress scenarios</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Review quarter-over-quarter historical replay</span>
                </li>
              </ul>
            </div>
            <div className="mt-10 pt-6 border-t border-border text-xs text-text-tertiary">
              Workspace access optimized for quantitative depth.
            </div>
          </Card>

          {/* CFO Card - Gold Border */}
          <Card className="p-8 rounded-2xl bg-card border-2 border-cfo-gold/50 hover:border-cfo-gold shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-cfo-gold/10 text-cfo-gold">
                  <FileCheck className="w-7 h-7" />
                </div>
                <span className="inline-flex items-center rounded-full border border-cfo-gold/30 bg-cfo-gold/10 px-3 py-1 text-xs font-semibold text-cfo-gold">
                  EXECUTIVE GOVERNANCE
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">CFO & Executives</h3>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">
                Plain-language summary auditing and mandatory compliance clearance.
              </p>

              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-cfo-gold/15 text-cfo-gold shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Dedicated pending approvals review queue</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-cfo-gold/15 text-cfo-gold shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>One-click formal approval or rejection workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-cfo-gold/15 text-cfo-gold shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Distilled plain-language narrative summaries</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-cfo-gold/15 text-cfo-gold shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Mandatory audit logging with rejection rationale</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-cfo-gold/15 text-cfo-gold shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Strict isolation from unverified raw metric formulas</span>
                </li>
              </ul>
            </div>
            <div className="mt-10 pt-6 border-t border-border text-xs text-text-tertiary">
              Defending firm integrity before publication.
            </div>
          </Card>

          {/* Admin Card - Blue Border */}
          <Card className="p-8 rounded-2xl bg-card border-2 border-info/50 hover:border-info shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-info/10 text-info">
                  <Users className="w-7 h-7" />
                </div>
                <span className="inline-flex items-center rounded-full border border-info/20 bg-info/10 px-3 py-1 text-xs font-semibold text-info">
                  ADMINISTRATION
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">Admin</h3>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">
                System governance, user provisioning, and portfolio onboarding.
              </p>

              <ul className="space-y-4 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-info/10 text-info shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Provisioned user account lifecycle management</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-info/10 text-info shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Strict role assignment and access control governance</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-info/10 text-info shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Client portfolio mapping & bulk ticker CSV onboarding</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-info/10 text-info shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Data source connection & institution monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-info/10 text-info shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Real-time platform health and security audit oversight</span>
                </li>
              </ul>
            </div>
            <div className="mt-10 pt-6 border-t border-border text-xs text-text-tertiary">
              Complete oversight over tenant data structure.
            </div>
          </Card>
        </div>
      </section>

      {/* 5. COMPLIANCE BANNER */}
      <section id="compliance" className="py-20 px-6 sm:px-8 max-w-5xl mx-auto w-full mb-12">
        <Card className="p-10 sm:p-16 rounded-3xl bg-card border border-border shadow-elevated text-center relative overflow-hidden">
          {/* Decorative background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <Badge variant="soft" className="mb-6 px-4 py-1.5 text-xs tracking-widest uppercase font-bold">
              COMPLIANCE FIRST
            </Badge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 max-w-2xl mx-auto leading-tight">
              Access is provisioned, never self-served
            </h2>

            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              To guarantee institutional data security and strict advisory governance, FinSight operates zero public sign-up flows. Every credential is provisioned, verified, and managed exclusively by your designated firm administrators.
            </p>

            <Link href="/login" className="focus:outline-none">
              <Button
                size="lg"
                className="px-8 py-6 text-base font-semibold shadow-card hover:shadow-elevated transition-transform hover:-translate-y-0.5 flex items-center gap-2.5"
              >
                <span>Go to sign in</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* 6. FOOTER */}
      <footer className="w-full border-t border-border bg-surface py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2 font-bold text-base text-foreground tracking-tight">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              FS
            </div>
            <span>FinSight Financial Intelligence</span>
          </div>
          
          <p className="text-sm text-text-secondary font-medium">
            Demo environment with modelled data.
          </p>

          <p className="text-xs text-text-tertiary pt-4">
            &copy; {new Date().getFullYear()} FinSight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
