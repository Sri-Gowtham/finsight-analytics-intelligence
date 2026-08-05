'use client';

import { useCfoApprovedInsights } from '@/lib/hooks';
import { RoleGuard } from '@/components/role-guard';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';

export default function ApprovedHistoryPage() {
  const { data: insights, isLoading } = useCfoApprovedInsights();

  return (
    <RoleGuard allowedRoles={['cfo']}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approved History</h1>
          <p className="text-text-secondary mt-2">
            View all approved insights and their publication history
          </p>
        </div>

        {/* Table/List */}
        {isLoading ? (
          <div className="space-y-3 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-lg animate-pulse w-full" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-lg w-full border border-border">
            <p className="text-text-secondary">No approved insights yet</p>
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {insights.map((insight) => (
              <Link href={`/cfo/insight/${insight.id}`} key={insight.id} className="block w-full">
                <div className="bg-card border border-border rounded-lg shadow-card p-6 hover:border-cfo-gold hover:shadow-elevated transition-all cursor-pointer w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-cfo-gold font-mono">{insight.ticker}</span>
                        <span className="text-lg font-semibold text-foreground">
                          {insight.company_name}
                        </span>
                        <span className="px-2.5 py-0.5 bg-surface text-foreground border border-border text-xs font-semibold rounded">
                          {insight.insight_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Calendar className="w-4 h-4 text-cfo-gold" />
                        Approved on{' '}
                        {insight.approved_at
                          ? new Date(insight.approved_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-cfo-gold/20 text-cfo-gold border border-cfo-gold/40 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
                        Approved
                      </span>
                      <ChevronRight className="w-5 h-5 text-cfo-gold" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
