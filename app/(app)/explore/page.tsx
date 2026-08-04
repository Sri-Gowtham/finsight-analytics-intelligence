'use client';

import Link from 'next/link';
import { useBanks } from '@/lib/hooks';
import { MetricCard } from '@/components/ui-components';
import { RoleGuard } from '@/components/role-guard';
import { ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExplorePage() {
  const { data: banks, isLoading } = useBanks();

  return (
    <RoleGuard allowedRoles={['analyst']}>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Explore Banks</h1>
        <p className="text-text-secondary mt-1">
          Browse and analyze the world&apos;s leading financial institutions
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by bank name, ticker..."
          className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option>All Regions</option>
          <option>United States</option>
          <option>Europe</option>
          <option>Asia Pacific</option>
          <option>Canada</option>
        </select>
      </div>

      {/* Banks Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">Loading banks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banks.map((bank) => (
            <Link key={bank.id} href={`/bank/${bank.id}`}>
              <div className="bg-background border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{bank.name}</h3>
                    <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                      <Globe className="w-4 h-4" />
                      {bank.country}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary font-mono font-semibold rounded">
                    {bank.ticker}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                  <div>
                    <p className="text-xs text-text-tertiary">Assets</p>
                    <p className="font-semibold text-foreground">
                      ${(bank.metrics.totalAssets / 1000).toFixed(1)}B
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Capital Ratio</p>
                    <p className="font-semibold text-foreground">{bank.metrics.capitalRatio}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">ROE</p>
                    <p className="font-semibold text-foreground">{bank.metrics.returnOnEquity}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Employees</p>
                    <p className="font-semibold text-foreground">
                      {(bank.employees / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                {/* Insights Count */}
                <div className="p-3 bg-surface rounded-lg border border-border mb-6">
                  <p className="text-sm text-text-secondary">
                    {bank.insights.length} AI-generated insights
                  </p>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-primary font-semibold group">
                  View Details
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
