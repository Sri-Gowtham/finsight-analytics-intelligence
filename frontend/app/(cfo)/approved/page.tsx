'use client';

import { useCfoApprovedInsights } from '@/lib/hooks';
import { RoleGuard } from '@/components/role-guard';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';

export default function ApprovedHistoryPage() {
  const { data: insights, isLoading } = useCfoApprovedInsights();

  return (
    <RoleGuard allowedRoles={['cfo']}>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approved History</h1>
          <p className="text-text-secondary mt-2">
            View all approved insights and their publication history
          </p>
        </div>

        {/* Table/List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-lg">
            <p className="text-text-secondary">No approved insights yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <Link href={`/insight/${insight.id}`} key={insight.id}>
                <div className="bg-background border border-border rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-primary">{insight.ticker}</span>
                        <span className="text-lg font-semibold text-foreground">
                          {insight.company_name}
                        </span>
                        <span className="px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded">
                          {insight.insight_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Calendar className="w-4 h-4" />
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
                    <ChevronRight className="w-5 h-5 text-text-tertiary" />
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
