'use client';

import { useState } from 'react';
import { useBanks, useCreateScenario } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap, RotateCcw } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

const ALLOWED_METRICS = [
  { value: 'NIM',          label: 'Net Interest Margin (NIM)' },
  { value: 'NPA_percent',  label: 'Non-Performing Assets %' },
  { value: 'CAR',          label: 'Capital Adequacy Ratio (CAR)' },
  { value: 'loan_growth',  label: 'Loan Growth Rate' },
] as const;

type MetricKey = (typeof ALLOWED_METRICS)[number]['value'];

export default function WhatIfPage() {
  return (
    <RoleGuard allowedRoles={['analyst']}>
      <WhatIfContent />
    </RoleGuard>
  );
}

function WhatIfContent() {
  const { data: banks, isLoading: banksLoading } = useBanks();
  const { createScenario, isLoading: submitting } = useCreateScenario();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedMetric,    setSelectedMetric]    = useState<MetricKey>('NIM');
  const [hypotheticalValue, setHypotheticalValue] = useState('');
  const [result, setResult] = useState<{ scenario_id: number; insight: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setApiError(null);
    const value = parseFloat(hypotheticalValue);
    if (!selectedCompanyId) { setApiError('Please select a bank.'); return; }
    if (isNaN(value))        { setApiError('Please enter a valid numeric value.'); return; }

    try {
      const res = await createScenario({
        company_id:         selectedCompanyId,
        metric_name:        selectedMetric,
        hypothetical_value: value,
      });
      setResult(res);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to run scenario');
    }
  };

  const handleReset = () => {
    setResult(null);
    setApiError(null);
    setHypotheticalValue('');
  };

  if (banksLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-text-secondary">Loading banks…</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">What-If Scenario Analysis</h1>
        <p className="text-text-secondary mt-1">
          Model the directional impact of a single metric change on a bank.
        </p>
      </div>

      {/* Permanent disclaimer — always visible, no checkbox gate */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900">Important Disclaimer</p>
          <p className="text-sm text-amber-800">
            This tool is for exploratory analysis only. Results are AI-generated directional
            estimates — not investment advice, predictions, or guarantees. Actual outcomes may
            differ significantly based on market, regulatory, and operational factors.
          </p>
        </div>
      </div>

      {!result ? (
        /* ── Form ── */
        <div className="bg-background border border-border rounded-xl p-6 space-y-6">
          {/* Bank selector */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Bank</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a bank…</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.ticker})
                </option>
              ))}
            </select>
          </div>

          {/* Metric selector */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Metric to adjust</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ALLOWED_METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Hypothetical value */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Hypothetical value for{' '}
              <span className="text-primary">
                {ALLOWED_METRICS.find((m) => m.value === selectedMetric)?.label}
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              value={hypotheticalValue}
              onChange={(e) => setHypotheticalValue(e.target.value)}
              placeholder="Enter a numeric value (e.g. 4.5)"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-text-tertiary">
              Enter the value you want to test (e.g. NIM of 4.5 means 4.5%).
            </p>
          </div>

          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {apiError}
            </p>
          )}

          <div className="pt-2 border-t border-border">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedCompanyId || !hypotheticalValue}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              {submitting ? 'Running scenario…' : 'Run Scenario'}
            </Button>
          </div>
        </div>
      ) : (
        /* ── Result card ── */
        <div className="bg-background border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Scenario Result</h2>
              <p className="text-sm text-text-secondary mt-1">
                Scenario #{result.scenario_id} · AI-generated directional estimate
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
              Saved
            </span>
          </div>

          {/* AI-generated insight */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">AI Analysis</p>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {result.insight}
            </p>
          </div>

          {/* Disclaimer always visible on result */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 flex gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>This is a scenario estimate, not a prediction or guarantee.</span>
          </div>

          <div className="pt-2 border-t border-border">
            <Button onClick={handleReset} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Run Another Scenario
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
