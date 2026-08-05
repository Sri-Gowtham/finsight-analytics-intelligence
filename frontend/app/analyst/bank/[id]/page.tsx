'use server';

import BankDetailClient from './client';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value ?? '';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Parallel fetch: company list, metrics, and insights
  const [companiesRes, metricsRes, insightsRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/companies`, { headers }),
    fetch(`${BACKEND_URL}/api/companies/${id}/metrics`, { headers }),
    fetch(`${BACKEND_URL}/api/companies/${id}/insights`, { headers }),
  ]);

  if (!metricsRes.ok) {
    // Company not found or unauthorised
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-text-secondary">Bank not found</p>
      </div>
    );
  }

  const [companiesJson, metricsJson, insightsJson] = await Promise.all([
    companiesRes.json(),
    metricsRes.json(),
    insightsRes.json(),
  ]);

  const company = companiesJson.companies?.find(
    (c: any) => String(c.company_id) === String(id),
  );

  // Build the Bank object the client component expects
  const metricsMap: Record<string, number> = {};
  for (const row of metricsJson.metrics ?? []) {
    metricsMap[row.metric_name] = Number(row.value);
  }

  const bank = {
    id: String(id),
    name: company?.name ?? '',
    ticker: company?.ticker ?? '',
    country: company?.sector ?? '',
    headquarters: company?.exchange ?? '',
    founded: 0,
    employees: 0,
    metrics: {
      totalAssets:             metricsMap['total_assets']  ?? metricsMap['totalAssets']  ?? 0,
      netIncome:               metricsMap['net_income']     ?? metricsMap['netIncome']    ?? 0,
      capitalRatio:            metricsMap['CAR']            ?? metricsMap['capitalRatio'] ?? 0,
      loanToDepositRatio:      metricsMap['loan_growth']    ?? metricsMap['loanToDepositRatio'] ?? 0,
      nonPerformingLoansRatio: metricsMap['NPA_percent']    ?? metricsMap['nonPerformingLoansRatio'] ?? 0,
      returnOnAssets:          metricsMap['NIM']            ?? metricsMap['returnOnAssets'] ?? 0,
      returnOnEquity:          metricsMap['ROE']            ?? metricsMap['returnOnEquity'] ?? 0,
      costToIncomeRatio:       metricsMap['cost_income']    ?? metricsMap['costToIncomeRatio'] ?? 0,
    },
    insights: (insightsJson.insights ?? []).map((row: any) => ({
      id: String(row.insight_id),
      title: row.generated_text.split('.')[0].trim().slice(0, 80),
      description: row.generated_text,
      severity: 'neutral' as const,
      source: 'financial' as const,
      date: new Date(row.created_at),
      aiGenerated: true,
    })),
    badges: [],
  };

  return <BankDetailClient bank={bank} />;
}
