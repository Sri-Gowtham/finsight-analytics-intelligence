import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Zap, 
  CheckCircle, 
  Users, 
  Lock, 
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="px-6 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Insight, not opinion
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              Financial professionals waste valuable time on manual analysis instead of making decisions — FinSight converts raw data into clear, actionable insights.
            </p>
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Log In <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Hero Visual - Insight Trail Mock */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-semibold text-primary">
                  Capital Ratio
                </div>
                <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-semibold text-primary">
                  +240 bps
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                Capital ratio exceeds regulatory requirements, demonstrating strong financial resilience and capacity for growth initiatives.
              </p>
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-text-secondary">
                  <span className="font-semibold">Source:</span> Basel III regulatory reporting, Q2 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="px-6 py-20 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From raw data to actionable insight in four transparent steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-primary/10 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Real Metrics</h3>
              <p className="text-sm text-text-secondary">
                Financial metrics computed from verified data: NIM, NPA, CAR, loan growth — plain code, no AI guesswork.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-accent-ai/10 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-accent-ai" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Narration</h3>
              <p className="text-sm text-text-secondary">
                AI narrates the numbers into plain language. Never invents figures, never calculates independently.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-info/10 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-info" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Transparent Trail</h3>
              <p className="text-sm text-text-secondary">
                Every insight shows its full source trail. Complete transparency — nothing is a black box.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-success/10 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">CFO Approval</h3>
              <p className="text-sm text-text-secondary">
                CFOs review and approve insights before they reach decision-makers. No unchecked analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR SECTION */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Who It's For</h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Designed for financial consultancy and advisory firms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Analyst Card */}
          <div className="border border-border rounded-lg p-8 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Financial Analysts</h3>
            <p className="text-sm text-text-secondary mb-4">Full-depth analysis</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Insight Trail with full source data</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Peer Comparison across sectors</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Historical Replay (point-in-time views)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>What-If Scenario Analysis</span>
              </li>
            </ul>
          </div>

          {/* CFO Card */}
          <div className="border border-border rounded-lg p-8 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-accent-ai/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-accent-ai" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">CFOs & Decision-Makers</h3>
            <p className="text-sm text-text-secondary mb-4">Summary + approval</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent-ai">•</span>
                <span>Clean review queue</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-ai">•</span>
                <span>Plain-language summaries</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-ai">•</span>
                <span>One-click approve/reject</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-ai">•</span>
                <span>Audit trail for compliance</span>
              </li>
            </ul>
          </div>

          {/* Admin Card */}
          <div className="border border-border rounded-lg p-8 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-info" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">System Administrators</h3>
            <p className="text-sm text-text-secondary mb-4">Setup & management</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-info">•</span>
                <span>User provisioning</span>
              </li>
              <li className="flex gap-2">
                <span className="text-info">•</span>
                <span>Client portfolio management</span>
              </li>
              <li className="flex gap-2">
                <span className="text-info">•</span>
                <span>Data source configuration</span>
              </li>
              <li className="flex gap-2">
                <span className="text-info">•</span>
                <span>System health monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* KEY FEATURES SECTION */}
      <section className="px-6 py-20 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Key Features</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything your team needs for transparent financial analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Transparent Insight Trail</h3>
              <p className="text-sm text-text-secondary">
                Full source attribution and metric breakdown. No black boxes, complete traceability.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="w-10 h-10 bg-accent-ai/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-accent-ai" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Peer Comparison</h3>
              <p className="text-sm text-text-secondary">
                Same-sector peer analysis. Understand how institutions rank relative to competitors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Historical Replay</h3>
              <p className="text-sm text-text-secondary">
                Point-in-time analysis. See how metrics and insights evolved over time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">What-If Scenarios</h3>
              <p className="text-sm text-text-secondary">
                Model parameter changes. Always clearly marked as estimates, never predictions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Financial Metrics</h3>
              <p className="text-sm text-text-secondary">
                NIM, NPA, CAR, loan growth, and deposit trends. All from verified regulatory data.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="w-10 h-10 bg-accent-ai/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5 text-accent-ai" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">CFO Review Queue</h3>
              <p className="text-sm text-text-secondary">
                Governance layer. Every insight reviewed and approved before reaching stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE / TRUST SECTION */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="bg-surface border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Insight, Not Advice</h2>
          <p className="text-text-secondary leading-relaxed">
            FinSight provides insight, not investment advice. We never say buy, sell, or hold. Every number is traceable to its source. Our role is to convert raw financial data into clear analysis for your decision-makers — not to make decisions for them. All insights go through CFO review before distribution, and every metric is backed by verified regulatory data.
          </p>
        </div>
      </section>
    </div>
  );
}
