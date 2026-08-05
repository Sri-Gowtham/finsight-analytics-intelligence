'use client';

import { useBanks } from '@/lib/hooks';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/role-guard';

export default function PeerComparisonPage() {
  return (
    <RoleGuard allowedRoles={['analyst']}>
      <PeerComparisonContent />
    </RoleGuard>
  );
}

function PeerComparisonContent() {
  const { data: banks, isLoading } = useBanks();

  const metrics = [
    { key: 'totalAssets', label: 'Total Assets (B USD)', format: (v: number) => (v / 1000).toFixed(1) },
    { key: 'netIncome', label: 'Net Income (B USD)', format: (v: number) => (v / 1000).toFixed(1) },
    { key: 'capitalRatio', label: 'Capital Ratio (%)', format: (v: number) => v.toFixed(2) },
    { key: 'returnOnAssets', label: 'ROA (%)', format: (v: number) => v.toFixed(2) },
    { key: 'returnOnEquity', label: 'ROE (%)', format: (v: number) => v.toFixed(2) },
    { key: 'costToIncomeRatio', label: 'Cost-to-Income (%)', format: (v: number) => (v * 100).toFixed(1) },
    { key: 'loanToDepositRatio', label: 'Loan-to-Deposit (%)', format: (v: number) => (v * 100).toFixed(1) },
    { key: 'nonPerformingLoansRatio', label: 'NPL Ratio (%)', format: (v: number) => (v * 100).toFixed(2) },
  ];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-text-secondary">Loading comparison...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Peer Comparison</h1>
        <p className="text-text-secondary mt-1">Compare key financial metrics across banks</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option>All Banks</option>
          <option>Top 3</option>
          <option>Regional Leaders</option>
        </select>
        <Button variant="outline">Export Comparison</Button>
      </div>

      {/* Comparison Table */}
      <div className="bg-background border border-border rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground sticky left-0 bg-surface">
                Metric
              </th>
              {banks.map((bank) => (
                <th key={bank.id} className="px-6 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                  <div className="font-bold">{bank.ticker}</div>
                  <div className="text-xs text-text-secondary font-normal">{bank.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => (
              <tr
                key={metric.key}
                className={`border-b border-border ${idx % 2 === 0 ? 'bg-background' : 'bg-surface'}`}
              >
                <td className="px-6 py-4 text-sm font-medium text-foreground sticky left-0 bg-inherit">
                  {metric.label}
                </td>
                {banks.map((bank) => {
                  const value = bank.metrics[metric.key as keyof typeof bank.metrics] as number;
                  const values = banks.map((b) => b.metrics[metric.key as keyof typeof b.metrics] as number);
                  const isMax = value === Math.max(...values);
                  const isMin = value === Math.min(...values);

                  return (
                    <td
                      key={bank.id}
                      className={`px-6 py-4 text-right text-sm font-medium ${
                        isMax ? 'text-emerald-600 bg-emerald-50/30' : isMin ? 'text-amber-600 bg-amber-50/30' : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {metric.format(value)}
                        {isMax && <TrendingUp className="w-4 h-4" />}
                        {isMin && <TrendingDown className="w-4 h-4" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded"></span>
          <span className="text-text-secondary">Highest value</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></span>
          <span className="text-text-secondary">Lowest value</span>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-3">
        <h3 className="font-semibold text-foreground">Key Insights</h3>
        <ul className="space-y-2 text-sm text-text-secondary list-disc list-inside">
          <li>Asia Pacific Bank leads with highest ROE (10.8%) indicating superior profitability</li>
          <li>
            Global Finance Corp maintains strong capital position with 14.2% capital ratio
          </li>
          <li>
            European Banking Group shows efficient operations with lowest cost-to-income ratio
            (62%)
          </li>
          <li>
            Monitor asset quality: Global Finance Corp has highest NPL ratio at 0.85%
          </li>
        </ul>
      </div>
    </div>
  );
}
