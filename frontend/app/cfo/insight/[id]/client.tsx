'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCfoInsightById, useApproveInsight, useRejectInsight } from '@/lib/hooks';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function InsightDetailClient({ insightId }: { insightId: string }) {
  const router = useRouter();
  const { data: insight, isLoading, error } = useCfoInsightById(insightId);
  const { approve, isLoading: approving } = useApproveInsight();
  const { reject, isLoading: rejecting } = useRejectInsight();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    try {
      await approve(insightId);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async () => {
    try {
      await reject(insightId, rejectReason);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  return (
    <RoleGuard allowedRoles={['cfo']}>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/90 mb-6 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-surface rounded animate-pulse w-1/3" />
            <div className="h-32 bg-surface rounded animate-pulse" />
          </div>
        ) : error || !insight ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Insight not found</p>
          </div>
        ) : insight.approval_status === 'approved' ? (
          <div className="bg-background border border-border rounded-lg p-8 space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {insight.company_name} ({insight.ticker})
                </h1>
                <p className="text-sm text-text-secondary">
                  Approved on {insight.approved_at ? new Date(insight.approved_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Insight Type
                </h2>
                <p className="text-foreground font-medium">{insight.insight_type}</p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Summary
                </h2>
                <p className="text-foreground leading-relaxed">{insight.generated_text}</p>
              </div>

              {insight.metric_types && insight.metric_types.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    Analysis Based On
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {insight.metric_types.map((metric) => (
                      <span
                        key={metric}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border text-center text-sm text-text-secondary">
              This insight has been approved and published.
            </div>
          </div>
        ) : insight.approval_status === 'rejected' ? (
          <div className="bg-background border border-border rounded-lg p-8 space-y-6">
            <div className="flex items-start gap-4">
              <XCircle className="w-6 h-6 text-error flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {insight.company_name} ({insight.ticker})
                </h1>
                <p className="text-sm text-text-secondary">
                  Rejected on {insight.rejected_at ? new Date(insight.rejected_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Insight Type
                </h2>
                <p className="text-foreground font-medium">{insight.insight_type}</p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Summary
                </h2>
                <p className="text-foreground leading-relaxed">{insight.generated_text}</p>
              </div>

              {insight.rejection_reason && (
                <div className="p-4 bg-error/5 border border-error/20 rounded-lg">
                  <h3 className="font-semibold text-sm text-error mb-1">Rejection Reason</h3>
                  <p className="text-sm text-foreground">{insight.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border text-center text-sm text-text-secondary">
              This insight has been rejected.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Insight Card */}
            <div className="bg-background border border-border rounded-lg p-8 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {insight.company_name}
                </h1>
                <div className="flex items-center gap-3 text-lg">
                  <span className="font-mono font-bold text-primary">{insight.ticker}</span>
                  <span className="text-lg font-semibold text-foreground">{insight.insight_type}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  AI Generated Summary
                </h2>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-foreground leading-relaxed text-base">{insight.generated_text}</p>
                </div>
              </div>

              {insight.metric_types && insight.metric_types.length > 0 && (
                <div className="p-4 bg-surface border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-3">Show Basis</h3>
                  <p className="text-sm text-text-secondary mb-3">Based on analysis of:</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.metric_types.map((metric) => (
                      <span
                        key={metric}
                        className="px-3 py-1 bg-background border border-border rounded-full text-sm text-foreground font-medium"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!showRejectForm ? (
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="outline"
                  disabled={rejecting}
                  className="border-border hover:bg-surface"
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="bg-cfo-gold hover:bg-cfo-gold/90 text-white"
                >
                  {approving ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            ) : (
              <div className="bg-background border border-border rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Add a reason for rejecting this insight..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowRejectForm(false)}
                    variant="outline"
                    className="border-border hover:bg-surface"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={rejecting}
                    className="bg-error hover:bg-error/90 text-white"
                  >
                    {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
