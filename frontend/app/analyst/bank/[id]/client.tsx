'use client';

import { Bank } from '@/lib/types';
import { StatusBadge, InsightCard, MetricCard, ExpandableSection } from '@/components/ui-components';
import { Button } from '@/components/ui/button';
import { Globe, Users, Calendar, Link as LinkIcon } from 'lucide-react';

export default function BankDetailClient({ bank }: { bank: Bank }) {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{bank.name}</h1>
            <p className="text-text-secondary mt-2">
              {bank.country} • Founded {bank.founded}
            </p>
          </div>
          <span className="px-4 py-2 bg-primary/10 text-primary font-mono font-bold text-lg rounded-lg">
            {bank.ticker}
          </span>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Globe className="w-4 h-4" />
            <span>{bank.headquarters}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Users className="w-4 h-4" />
            <span>{(bank.employees / 1000).toFixed(0)}K employees</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="w-4 h-4" />
            <span>{new Date().getFullYear() - bank.founded} years old</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <LinkIcon className="w-4 h-4" />
            <span>Publicly Traded</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {bank.badges.map((badge) => (
            <StatusBadge key={badge.id} badge={badge} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-white">Add to Dashboard</Button>
          <Button variant="outline">Compare with Peers</Button>
          <Button variant="outline">Download Report</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Financial Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Total Assets"
            value={bank.metrics.totalAssets >= 100000 ? (bank.metrics.totalAssets / 100000).toFixed(2) + 'L' : bank.metrics.totalAssets.toLocaleString('en-IN')}
            unit="₹ Cr"
          />
          <MetricCard
            label="Net Income"
            value={bank.metrics.netIncome >= 100000 ? (bank.metrics.netIncome / 100000).toFixed(2) + 'L' : bank.metrics.netIncome.toLocaleString('en-IN')}
            unit="₹ Cr"
            trend="up"
          />
          <MetricCard label="Capital Ratio" value={bank.metrics.capitalRatio} unit="%" />
          <MetricCard
            label="Loan-to-Deposit Ratio"
            value={(bank.metrics.loanToDepositRatio * 100).toFixed(1)}
            unit="%"
          />
          <MetricCard
            label="NPL Ratio"
            value={(bank.metrics.nonPerformingLoansRatio * 100).toFixed(2)}
            unit="%"
            trend="down"
          />
          <MetricCard label="Return on Assets" value={bank.metrics.returnOnAssets} unit="%" />
          <MetricCard label="Return on Equity" value={bank.metrics.returnOnEquity} unit="%" />
          <MetricCard
            label="Cost-to-Income Ratio"
            value={(bank.metrics.costToIncomeRatio * 100).toFixed(1)}
            unit="%"
          />
        </div>
      </div>

      {/* Insights Trail */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Insight Trail</h2>
        <div className="space-y-3">
          {bank.insights.map((insight, index) => (
            <div key={insight.id}>
              <InsightCard insight={insight} />
              {index < bank.insights.length - 1 && (
                <div className="h-4 flex justify-center py-2">
                  <div className="w-0.5 h-full bg-border"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Data Sources</h2>
        <div className="grid gap-4">
          <ExpandableSection title="Regulatory Filings" defaultOpen={true}>
            <div className="space-y-2 text-sm">
              <p className="text-text-secondary">
                Latest quarterly regulatory filings from {bank.country} financial authorities
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                <li>Q3 2025 Regulatory Report</li>
                <li>Annual Audit Report 2024</li>
                <li>Capital Adequacy Assessment</li>
                <li>Risk Management Documentation</li>
              </ul>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Market Data">
            <div className="space-y-2 text-sm">
              <p className="text-text-secondary">
                Real-time market information and analyst estimates
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                <li>Analyst Price Targets</li>
                <li>Trading Volume & Liquidity</li>
                <li>Peer Comparison Metrics</li>
                <li>Industry Benchmarks</li>
              </ul>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Operational Data">
            <div className="space-y-2 text-sm">
              <p className="text-text-secondary">
                Operational metrics and performance indicators
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                <li>Branch Network Information</li>
                <li>Digital Banking Metrics</li>
                <li>Customer Satisfaction Scores</li>
                <li>Employee Performance Data</li>
              </ul>
            </div>
          </ExpandableSection>
        </div>
      </div>
    </div>
  );
}
