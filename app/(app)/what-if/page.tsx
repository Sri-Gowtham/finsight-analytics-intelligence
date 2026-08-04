'use client';

import { useState } from 'react';
import { useBanks, useCreateScenario } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus } from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';

export default function WhatIfPage() {
  return (
    <RoleGuard allowedRoles={['analyst']}>
      <WhatIfContent />
    </RoleGuard>
  );
}

function WhatIfContent() {
  const { data: banks, isLoading: banksLoading } = useBanks();
  const { createScenario, isLoading: creatingScenario } = useCreateScenario();

  const [selectedBank, setSelectedBank] = useState<string>('');
  const [scenarioName, setScenarioName] = useState('');
  const [parameters, setParameters] = useState({
    assetChange: 0,
    incomeChange: 0,
    riskChange: 0,
    operationalChange: 0,
  });
  const [accepted, setAccepted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleParameterChange = (key: keyof typeof parameters, value: number) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateScenario = async () => {
    if (!accepted || !selectedBank || !scenarioName) {
      alert('Please fill all fields and accept the disclaimer');
      return;
    }

    try {
      const scenario = await createScenario({
        name: scenarioName,
        description: 'User-created scenario',
        bankId: selectedBank,
        parameters,
        results: {
          capitalRatioChange: parameters.assetChange * 0.5 + parameters.riskChange * -0.3,
          profitabilityImpact: parameters.incomeChange * 0.8,
          riskScoreChange: parameters.riskChange,
          recommendations: [
            'Monitor capital adequacy carefully',
            'Review risk exposure',
            'Adjust lending strategy as needed',
          ],
        },
      });

      setResults(scenario.results);
      setShowResults(true);
      setScenarioName('');
      setParameters({ assetChange: 0, incomeChange: 0, riskChange: 0, operationalChange: 0 });
      setAccepted(false);
    } catch (error) {
      alert('Failed to create scenario');
    }
  };

  if (banksLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-text-secondary">Loading banks...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">What-If Scenario Analysis</h1>
        <p className="text-text-secondary mt-1">Model potential outcomes and stress test strategies</p>
      </div>

      {/* Disclaimer - MANDATORY */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-amber-900">Important Disclaimer</h3>
            <p className="text-sm text-amber-800">
              This what-if analysis tool is for educational and exploratory purposes only. Results are based on
              simplified mathematical models and assumptions. They do not constitute investment advice or official
              financial forecasts. Actual outcomes may differ significantly from projections based on unforeseen
              market conditions, regulatory changes, and other factors.
            </p>
            <p className="text-sm text-amber-800">
              Users must conduct their own due diligence and consult with qualified financial professionals before
              making any decisions based on this analysis.
            </p>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm text-amber-900">
                I understand and accept the limitations of this analysis tool
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Form */}
      {!showResults ? (
        <div className="bg-background border border-border rounded-xl p-6 space-y-6">
          {/* Bank Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Select Bank</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              disabled={!accepted}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              <option value="">Choose a bank...</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.ticker})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Scenario Name</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              disabled={!accepted}
              placeholder="e.g., Interest Rate Rise, Economic Slowdown"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Model Parameters</h3>
            <div className="space-y-3">
              {[
                {
                  key: 'assetChange',
                  label: 'Asset Base Change',
                  description: '% change in total assets',
                },
                {
                  key: 'incomeChange',
                  label: 'Income Change',
                  description: '% change in net income',
                },
                {
                  key: 'riskChange',
                  label: 'Risk Level Change',
                  description: '% change in risk exposure',
                },
                {
                  key: 'operationalChange',
                  label: 'Operational Efficiency Change',
                  description: '% change in operational efficiency',
                },
              ].map((param) => (
                <div key={param.key} className="space-y-2" disabled={!accepted}>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-foreground">{param.label}</label>
                    <span className="text-sm font-semibold text-primary">
                      {parameters[param.key as keyof typeof parameters] > 0 ? '+' : ''}
                      {parameters[param.key as keyof typeof parameters]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={parameters[param.key as keyof typeof parameters]}
                    onChange={(e) =>
                      handleParameterChange(
                        param.key as keyof typeof parameters,
                        parseFloat(e.target.value)
                      )
                    }
                    disabled={!accepted}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                  <p className="text-xs text-text-tertiary">{param.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleCreateScenario}
              disabled={!accepted || !selectedBank || creatingScenario}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {creatingScenario ? 'Creating...' : 'Create Scenario'}
            </Button>
            <Button variant="outline">Save Template</Button>
          </div>
        </div>
      ) : (
        /* Results */
        <div className="bg-background border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Scenario Results</h2>
            <p className="text-text-secondary mt-1">Model output for your scenario</p>
          </div>

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface rounded-lg border border-border">
                <p className="text-sm text-text-secondary">Capital Ratio Impact</p>
                <p className={`text-2xl font-bold mt-2 ${results.capitalRatioChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {results.capitalRatioChange > 0 ? '+' : ''}
                  {results.capitalRatioChange.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <p className="text-sm text-text-secondary">Profitability Impact</p>
                <p className={`text-2xl font-bold mt-2 ${results.profitabilityImpact > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {results.profitabilityImpact > 0 ? '+' : ''}
                  {results.profitabilityImpact.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <p className="text-sm text-text-secondary">Risk Score Impact</p>
                <p className={`text-2xl font-bold mt-2 ${results.riskScoreChange < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {results.riskScoreChange > 0 ? '+' : ''}
                  {results.riskScoreChange.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {results && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <h4 className="font-semibold text-blue-900">Recommendations</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {results.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span>•</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => setShowResults(false)}
              className="flex-1"
              variant="outline"
            >
              Create Another Scenario
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white">Save Scenario</Button>
          </div>
        </div>
      )}
    </div>
  );
}
