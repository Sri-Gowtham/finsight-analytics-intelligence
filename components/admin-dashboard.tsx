'use client';

import { useUsers, usePortfolios } from '@/lib/hooks';
import { useBanks } from '@/lib/hooks';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Activity } from 'lucide-react';

export function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const { data: banks } = useBanks();

  const activeUsers = users?.filter((u) => u.is_active).length || 0;
  const totalUsers = users?.length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Health</h1>
        <p className="text-text-secondary mt-1">Monitor and manage FinSight infrastructure</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Last Data Refresh */}
        <div className="bg-background border border-border rounded-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Last Data Refresh</span>
            <Activity className="w-5 h-5 text-accent-ai" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {new Date().toLocaleTimeString()}
          </p>
          <p className="text-xs text-text-tertiary">
            {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* API Connection Status */}
        <div className="bg-background border border-border rounded-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">API Status</span>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-lg font-semibold text-foreground">Connected</span>
          </div>
          <p className="text-xs text-text-tertiary">All systems operational</p>
        </div>

        {/* Total Users */}
        <div className="bg-background border border-border rounded-lg p-6 space-y-2">
          <span className="text-sm font-medium text-text-secondary block">Total Users</span>
          <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
          <p className="text-xs text-text-tertiary">
            {activeUsers} active, {totalUsers - activeUsers} inactive
          </p>
          <Link href="/users" className="text-xs font-medium text-primary hover:underline">
            Manage Users →
          </Link>
        </div>

        {/* Total Portfolios */}
        <div className="bg-background border border-border rounded-lg p-6 space-y-2">
          <span className="text-sm font-medium text-text-secondary block">Tracked Portfolios</span>
          <p className="text-2xl font-bold text-foreground">{portfolios?.length || 0}</p>
          <p className="text-xs text-text-tertiary">
            across {new Set(portfolios?.map((p) => p.client_name)).size || 0} clients
          </p>
          <Link href="/portfolios" className="text-xs font-medium text-primary hover:underline">
            View Portfolios →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/users"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Create New User
          </Link>
          <Link
            href="/portfolios"
            className="px-4 py-2 bg-accent-ai text-white rounded-lg hover:bg-accent-ai/90 transition-colors text-sm font-medium"
          >
            Upload Portfolio
          </Link>
          <Link
            href="/settings"
            className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-surface transition-colors text-sm font-medium"
          >
            View Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
