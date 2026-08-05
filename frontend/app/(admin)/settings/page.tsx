'use client';

import { useState, useEffect } from 'react';
import { useDataSourceSettings, useUpdateDataSourceSettings } from '@/lib/hooks';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <SettingsContent />
    </RoleGuard>
  );
}

function SettingsContent() {
  const { data: settings, isLoading } = useDataSourceSettings();
  const { update: updateSettings, isLoading: isUpdating } = useUpdateDataSourceSettings();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.api_key);
      setLastTestTime(settings.last_connection_test);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(apiKey, false);
    alert('Settings saved successfully');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const result = await updateSettings(apiKey, true);
      if (result?.success) {
        setTestStatus('success');
        setLastTestTime(new Date());
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('failed');
        setTimeout(() => setTestStatus('idle'), 3000);
      }
    } catch (err) {
      setTestStatus('failed');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-center text-text-secondary">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Source Settings</h1>
        <p className="text-text-secondary mt-1">Configure API connection and data source settings</p>
      </div>

      {/* API Configuration Card */}
      <div className="bg-background border border-border rounded-lg p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">API Configuration</h2>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-foreground bg-surface font-mono text-sm"
                  placeholder="sk_test_..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-text-tertiary">Your API key is stored securely and never shared</p>
          </div>

          {/* Connection Status */}
          <div className="mt-6 p-4 rounded-lg bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Connection Status</span>
              {settings?.connection_status === 'connected' && (
                <div className="flex items-center gap-2 text-success">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm font-semibold">Connected</span>
                </div>
              )}
              {settings?.connection_status === 'disconnected' && (
                <div className="flex items-center gap-2 text-warning">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span className="text-sm font-semibold">Disconnected</span>
                </div>
              )}
            </div>
            {lastTestTime && (
              <p className="text-xs text-text-secondary">
                Last tested: {lastTestTime.toLocaleString()}
              </p>
            )}
          </div>

          {/* Test Connection Result */}
          {testStatus !== 'idle' && (
            <div className={`mt-4 p-4 rounded-lg border flex items-center gap-3 ${
              testStatus === 'testing'
                ? 'bg-accent-ai/10 border-accent-ai/30'
                : testStatus === 'success'
                  ? 'bg-success/10 border-success/30'
                  : 'bg-warning/10 border-warning/30'
            }`}>
              {testStatus === 'testing' && (
                <>
                  <Loader className="w-5 h-5 text-accent-ai animate-spin flex-shrink-0" />
                  <span className="text-sm text-accent-ai font-medium">Testing connection...</span>
                </>
              )}
              {testStatus === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm text-success font-medium">Connection successful!</span>
                </>
              )}
              {testStatus === 'failed' && (
                <>
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                  <span className="text-sm text-warning font-medium">Connection failed. Check your API key.</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <Button
              onClick={handleTestConnection}
              disabled={isUpdating || testStatus === 'testing'}
              className="px-6 py-2 border border-accent-ai text-accent-ai rounded-lg hover:bg-accent-ai/10 transition-colors font-medium disabled:opacity-50"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-2">Data Source Integration</h3>
        <p className="text-sm text-text-secondary">
          This API key is used to fetch real-time financial data from our data providers. Your connection status
          is automatically monitored, and any issues are logged for troubleshooting.
        </p>
      </div>
    </div>
  );
}
