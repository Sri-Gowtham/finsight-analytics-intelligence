'use client';

import { Badge, Insight, BankMetrics } from '@/lib/types';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';

export function StatusBadge({ badge }: { badge: Badge }) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${colorMap[badge.color]}`}
    >
      <span>{badge.icon}</span>
      {badge.label}
    </span>
  );
}

export function InsightCard({ insight }: { insight: Insight }) {
  const severityConfig = {
    positive: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
      Icon: CheckCircle,
    },
    neutral: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      Icon: Zap,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      Icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      Icon: AlertCircle,
    },
  };

  const config = severityConfig[insight.severity];
  const Icon = config.Icon;

  return (
    <div className={`p-4 rounded-lg border shadow-card ${config.bg} ${config.border} space-y-2`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.icon}`} />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground">{insight.title}</h4>
            {insight.aiGenerated && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">AI</span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">{insight.description}</p>
          <p className="text-xs text-text-tertiary mt-2">
            {insight.date.toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  unit = '',
  trend,
}: {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    stable: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  const config = trend ? trendConfig[trend] : null;
  const TrendIcon = config?.icon;

  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-4 space-y-2">
      <p className="text-sm text-text-secondary">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </p>
          {unit && <p className="text-sm text-text-tertiary">{unit}</p>}
        </div>
        {config && TrendIcon && (
          <div className={`${config.bg} p-2 rounded-lg`}>
            <TrendIcon className={`w-4 h-4 ${config.color}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export function ExpandableSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = require('react').useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-lg shadow-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
      >
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className="border-t border-border p-4 space-y-3">{children}</div>}
    </div>
  );
}
