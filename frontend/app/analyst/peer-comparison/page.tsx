'use client';

import { useState } from 'react';
import { useBanks } from '@/lib/hooks';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/role-guard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type MetricKey = 'totalAssets' | 'netIncome' | 'capitalRatio' | 'returnOnAssets' | 'returnOnEquity' | 'costToIncomeRatio' | 'loanToDepositRatio' | 'nonPerformingLoansRatio';

const METRICS: { key: MetricKey; label: string; format: (v: number) => string } = [
  { key: 'totalAssets', label: 'Total Assets (₹ Cr)', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
  { key: 'netIncome', label: 'Net Income (₹ Cr)', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
  { key: 'capitalRatio', label: 'Capital Ratio (%)', format: (v: number) => `${v.toFixed(2)}%` },
  { key: 'returnOnAssets', label: 'ROA (%)', format: (v: number) => `${v.toFixed(2)}%` },
  { key: 'returnOnEquity', label: 'ROE (%)', format: (v: number) => `${v.toFixed(2)}%` },
  { key: 'costToIncomeRatio', label: 'Cost-to-Income (%)', format: (v: number) => `${v.toFixed(1)}%` },
  { key: 'loanToDepositRatio', label: 'Loan-to-Deposit (%)', format: (v: number) => `${v.toFixed(1)}%` },
  { key: 'nonPerformingLoansRatio', label: 'NPA Ratio (%)', format: (v: number) => `${v.toFixed(2)}%` },
];

export default function PeerComparisonPage() {
  return (
    <RoleGuard allowedRoles={['analyst']}>
      <PeerComparisonContent />
    </RoleGuard>
  );
}

function PeerComparisonContent() {
  const { data: banks, isLoading } = useBanks();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('returnOnEquity');

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-text-secondary">Loading comparison...</p>
      </div>
    );
  }

  const metricDef = METRICS.find(m => m.key === selectedMetric)!;

  // Prepare chart data
  const chartData = banks.map(bank => {
    let val = bank.metrics[selectedMetric] as number;
    // Adjust NPL ratio which might be stored as decimal (e.g. 1.17 instead of 0.0117? Wait, DB seeded 1.17 for NPA)
    // Actually the DB seeded NPA_percent as 1.17, so it's already a percent. 
    // The previous frontend multiplied by 100 in the format function for some metrics.
    // Let's NOT multiply by 100 since the DB seed uses real percentages (e.g., ROE 17.0).
    return {
      name: bank.ticker,
      fullName: bank.name,
      value: val,
    };
  });

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Peer Comparison</h1>
          <p className="text-text-secondary mt-1">Compare key financial metrics across banks</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">Export Comparison</Button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Interactive Chart</h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
            className="px-4 py-2 border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
          >
            {METRICS.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 100000) return `${(value/100000).toFixed(1)}L`;
                  if (value >= 1000) return `${(value/1000).toFixed(0)}k`;
                  return value.toString();
                }}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{data.fullName}</p>
                        <p className="text-indigo-600 font-medium">
                          {metricDef.label.split(' ')[0]}: {metricDef.format(data.value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]}
                barSize={60}
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value === maxValue ? '#4F46E5' : '#818CF8'} 
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analysis — derived from real data */}
      {banks.length > 0 && (() => {
        const byROE = [...banks].sort((a, b) => b.metrics.returnOnEquity - a.metrics.returnOnEquity);
        const byCap = [...banks].sort((a, b) => b.metrics.capitalRatio - a.metrics.capitalRatio);
        const byNPL = [...banks].sort((a, b) => b.metrics.nonPerformingLoansRatio - a.metrics.nonPerformingLoansRatio);
        
        const topROE = byROE[0];
        const topCap = byCap[0];
        const highNPL = byNPL[0];
        
        return (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Key Insights
            </h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              {topROE && (
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" />
                  <span>
                    <strong className="text-foreground">{topROE.name}</strong> leads with the highest ROE ({topROE.metrics.returnOnEquity}%), indicating superior profitability.
                  </span>
                </li>
              )}
              {topCap && (
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" />
                  <span>
                    <strong className="text-foreground">{topCap.name}</strong> maintains a strong capital position with a {topCap.metrics.capitalRatio}% capital ratio.
                  </span>
                </li>
              )}
              {highNPL && banks.length > 1 && (
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                  <span>
                    Monitor asset quality: <strong className="text-foreground">{highNPL.name}</strong> has the highest NPA ratio at {highNPL.metrics.nonPerformingLoansRatio}%.
                  </span>
                </li>
              )}
              {banks.length < 2 && (
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary/70 shrink-0" />
                  <span>Add more banks to the portfolio to see comparative insights.</span>
                </li>
              )}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}
