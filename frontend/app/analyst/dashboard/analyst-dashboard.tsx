'use client';

import { useState } from 'react';
import { useClients, useBankById } from '@/lib/hooks';
import { StatusBadge, InsightCard, MetricCard } from '@/components/ui-components';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnalystDashboard() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const [expandedClients, setExpandedClients] = useState<string[]>(['1']);

  const focusClient = clients.find((c) => c.role === 'focus');
  const peerClients = clients.filter((c) => c.role === 'peer');

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-text-secondary mt-1">Monitor your tracked banks and insights</p>
      </div>

      {/* Focus Client */}
      {focusClient && (
        <FocusClientSection
          clientId={focusClient.id}
          bankId={focusClient.bankId}
          bankName={focusClient.bankName}
        />
      )}

      {/* Peer Comparison */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Peer Clients</h2>
        {peerClients.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-text-secondary">No peer clients tracked yet</p>
            <Button className="mt-4">Add Peer Client</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {peerClients.map((client) => (
              <PeerClientCard
                key={client.id}
                clientId={client.id}
                bankId={client.bankId}
                bankName={client.bankName}
                isExpanded={expandedClients.includes(client.id)}
                onToggleExpand={(id) => {
                  setExpandedClients((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FocusClientSection({
  clientId,
  bankId,
  bankName,
}: {
  clientId: string;
  bankId: string;
  bankName: string;
}) {
  const { data: bank, isLoading } = useBankById(bankId);
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) return <div className="text-text-secondary">Loading...</div>;
  if (!bank) return null;

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-surface transition-colors"
      >
        <div className="text-left">
          <h2 className="text-xl font-bold text-foreground">{bank.name}</h2>
          <p className="text-sm text-text-secondary">Focus Client • {bank.country || bank.ticker}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-text-secondary" />
        ) : (
          <ChevronDown className="w-6 h-6 text-text-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border p-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {bank.badges.map((badge) => (
              <StatusBadge key={badge.id} badge={badge} />
            ))}
          </div>

          {/* Key Metrics */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Assets"
                value={bank.metrics.totalAssets / 1000}
                unit="B USD"
              />
              <MetricCard
                label="Net Income"
                value={bank.metrics.netIncome / 1000}
                unit="B USD"
                trend="up"
              />
              <MetricCard
                label="Capital Ratio"
                value={bank.metrics.capitalRatio}
                unit="%"
                trend="stable"
              />
              <MetricCard
                label="ROE"
                value={bank.metrics.returnOnEquity}
                unit="%"
                trend="up"
              />
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Recent Insights</h3>
            <div className="space-y-2">
              {bank.insights.slice(0, 3).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button className="flex-1">View Full Analysis</Button>
            <Button variant="outline">Compare Peers</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PeerClientCard({
  clientId,
  bankId,
  bankName,
  isExpanded,
  onToggleExpand,
}: {
  clientId: string;
  bankId: string;
  bankName: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  const { data: bank, isLoading } = useBankById(bankId);

  if (isLoading) return <div className="text-text-secondary">Loading...</div>;
  if (!bank) return null;

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => onToggleExpand(clientId)}
        className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
      >
        <div className="text-left">
          <p className="font-semibold text-foreground">{bank.name}</p>
          <p className="text-sm text-text-secondary">{bank.country || bank.ticker}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-tertiary">Assets</p>
            <p className="font-semibold text-foreground">
              ${(bank.metrics.totalAssets / 1000).toFixed(0)}B
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
          <div className="text-right">
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
