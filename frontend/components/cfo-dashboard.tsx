'use client';

import { useCfoPendingInsights } from '@/lib/hooks';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function CfoDashboard() {
  const { data: insights, isLoading } = useCfoPendingInsights();

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
        <p className="text-text-secondary mt-2">
          Review and approve generated insights for publishing
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-lg animate-pulse w-full" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg w-full border border-border">
          <CheckCircle2 className="w-12 h-12 text-cfo-gold mx-auto mb-3" />
          <p className="text-text-secondary">All insights have been reviewed</p>
        </div>
      ) : (
        <div className="grid gap-4 w-full">
          {insights.map((insight) => (
            <Link href={`/cfo/insight/${insight.id}`} key={insight.id} className="block w-full">
              <div className="bg-card border border-border rounded-lg shadow-card p-6 hover:border-cfo-gold hover:shadow-elevated transition-all cursor-pointer w-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-cfo-gold font-mono">
                        {insight.ticker}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {insight.company_name}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      {insight.insight_type}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-cfo-gold/20 text-cfo-gold border border-cfo-gold/40 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {insight.generated_text}
                </p>
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>
                    {insight.metric_types && insight.metric_types.length > 0
                      ? `Based on: ${insight.metric_types.join(', ')}`
                      : 'Multi-factor analysis'}
                  </span>
                  <span className="text-cfo-gold font-bold">Review →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
