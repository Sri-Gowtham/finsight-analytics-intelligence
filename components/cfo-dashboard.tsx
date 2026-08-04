'use client';

import { useCfoPendingInsights } from '@/lib/hooks';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function CfoDashboard() {
  const { data: insights, isLoading } = useCfoPendingInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
        <p className="text-text-secondary mt-2">
          Review and approve generated insights for publishing
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <p className="text-text-secondary">All insights have been reviewed</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {insights.map((insight) => (
            <Link href={`/insight/${insight.id}`} key={insight.id}>
              <div className="bg-background border border-border rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-text-secondary">
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
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
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
                  <span className="text-primary font-semibold">Review →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
