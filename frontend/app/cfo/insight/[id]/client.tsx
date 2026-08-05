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
      <div className="w-full space-y-6">
        {/* Header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-cfo-gold hover:text-cfo-gold/80 mb-4 font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isLoading ? (
          <div className="space-y-4 w-full">
            <div className="h-8 bg-surface rounded animate-pulse w-1/3" />
            <div className="h-32 bg-surface rounded animate-pulse w-full" />
          </div>
        ) : error || !insight ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface w-full">
            <p className="text-text-secondary">Insight not found</p>
          </div>
        ) : insight.approval_status === 'approved' ? (
          <div className="bg-background border border-cfo-gold/40 rounded-xl p-8 space-y-6 w-full shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-7 h-7 text-cfo-gold flex-shrink-0 mt-0.5" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {insight.company_name} (<span className="font-mono text-cfo-gold">{insight.ticker}</span>)
                  </h1>
                  <p className="text-sm text-text-secondary">
                    Approved on {insight.approved_at ? new Date(insight.approved_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 bg-cfo-gold/20 text-cfo-gold border border-cfo-gold/50 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
                Approved
              </span>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">
                  Insight Type
                </h2>
                <p className="text-foreground font-semibold text-lg">{insight.insight_type}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                  Summary
                </h2>
                <div className="p-5 bg-cfo-gold/5 border border-cfo-gold/20 rounded-lg">
                  <p className="text-foreground leading-relaxed text-base">{insight.generated_text}</p>
                </div>
              </div>

              {insight.metric_types && insight.metric_types.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                    Analysis Based On
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {insight.metric_types.map((metric) => (
                      <span
                        key={metric}
                        className="px-3 py-1 bg-cfo-gold/15 text-cfo-gold border border-cfo-gold/30 rounded-full text-sm font-medium"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border text-center text-sm text-cfo-gold font-medium">
              ✓ This insight has been executive-approved and published to records.
            </div>
          </div>
        ) : insight.approval_status === 'rejected' ? (
          <div className="bg-background border border-border rounded-xl p-8 space-y-6 w-full">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <XCircle className="w-7 h-7 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {insight.company_name} (<span className="font-mono text-destructive">{insight.ticker}</span>)
                  </h1>
                  <p className="text-sm text-text-secondary">
                    Rejected on {insight.rejected_at ? new Date(insight.rejected_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 bg-destructive/15 text-destructive border border-destructive/30 rounded-full text-xs font-bold uppercase tracking-wider">
                Rejected
              </span>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">
                  Insight Type
                </h2>
                <p className="text-foreground font-semibold text-lg">{insight.insight_type}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                  Summary
                </h2>
                <p className="text-foreground leading-relaxed text-base">{insight.generated_text}</p>
              </div>

              {insight.rejection_reason && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-sm text-destructive mb-1">Rejection Reason</h3>
                  <p className="text-sm text-foreground">{insight.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border text-center text-sm text-text-secondary font-medium">
              This insight was rejected and suppressed from publication.
            </div>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {/* Insight Card */}
            <div className="bg-background border border-border rounded-xl p-8 space-y-6 w-full shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {insight.company_name}
                  </h1>
                  <div className="flex items-center gap-3 text-lg">
                    <span className="font-mono font-bold text-cfo-gold">{insight.ticker}</span>
                    <span className="text-lg font-semibold text-foreground">{insight.insight_type}</span>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 bg-cfo-gold/20 text-cfo-gold border border-cfo-gold/50 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
                  Pending Review
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  AI Generated Summary
                </h2>
                <div className="p-5 bg-cfo-gold/5 border border-cfo-gold/30 rounded-lg">
                  <p className="text-foreground leading-relaxed text-base font-medium">{insight.generated_text}</p>
                </div>
              </div>

              {insight.metric_types && insight.metric_types.length > 0 && (
                <div className="p-5 bg-surface border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Basis of Evaluation</h3>
                  <p className="text-sm text-text-secondary mb-3">Based on verified audit analysis of:</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.metric_types.map((metric) => (
                      <span
                        key={metric}
                        className="px-3 py-1 bg-cfo-gold/15 text-cfo-gold border border-cfo-gold/30 rounded-full text-sm font-semibold"
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
