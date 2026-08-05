'use client';

import { useState } from 'react';
import { usePortfolios, useUploadPortfolio, useUpdatePortfolioEntry, useDeletePortfolioEntry, useBanks } from '@/lib/hooks';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export default function PortfoliosPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PortfoliosContent />
    </RoleGuard>
  );
}

function PortfoliosContent() {
  const { data: portfolios, isLoading } = usePortfolios();
  const { upload } = useUploadPortfolio();
  const { update } = useUpdatePortfolioEntry();
  const { delete_entry } = useDeletePortfolioEntry();
  const { data: banks } = useBanks();

  const [showUpload, setShowUpload] = useState(false);
  const [clientName, setClientName] = useState('');
  const [tickers, setTickers] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string>('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const tickerList = tickers.split(',').map((t) => t.trim().toUpperCase());
      const result = await upload(clientName, tickerList);
      setUploadResult(result);
      setClientName('');
      setTickers('');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    await update(id, editingCompanyId);
    setEditingId(null);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this portfolio entry?')) {
      await delete_entry(id);
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio Management</h1>
          <p className="text-text-secondary mt-1">Manage client portfolios and tracked banks</p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
        >
          <Plus className="w-5 h-5" />
          Upload Portfolio
        </Button>
      </div>

      {/* Upload Result Card */}
      {uploadResult && (
        <div className={`p-4 rounded-lg border ${
          uploadResult.success
            ? 'bg-success/10 border-success/30'
            : 'bg-warning/10 border-warning/30'
        }`}>
          <div className="flex items-start gap-3">
            {uploadResult.success ? (
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Upload Complete</h3>
              <p className="text-sm text-text-secondary mt-1">
                {uploadResult.inserted_count} inserted, {uploadResult.skipped_duplicates} duplicates skipped
              </p>
              {uploadResult.failed_tickers.length > 0 && (
                <div className="mt-3 p-3 bg-warning/20 rounded border border-warning/30">
                  <p className="text-xs font-semibold text-warning mb-2">Tickers not found:</p>
                  <p className="text-sm text-warning font-mono">{uploadResult.failed_tickers.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolios Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-secondary">Loading portfolios...</div>
        ) : portfolios && portfolios.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Bank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Ticker</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Uploaded By</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {portfolios.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{entry.client_name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {editingId === entry.id ? (
                      <select
                        value={editingCompanyId}
                        onChange={(e) => setEditingCompanyId(e.target.value)}
                        className="px-2 py-1 border border-border rounded text-sm bg-surface"
                      >
                        <option value="">Select bank...</option>
                        {banks?.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      entry.bank_name
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-primary font-semibold">{entry.ticker}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{entry.uploaded_by}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {editingId === entry.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(entry.id)}
                          className="px-2 py-1 bg-success/10 text-success rounded text-xs font-medium hover:bg-success/20"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-text-tertiary/10 text-text-secondary rounded text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(entry.id);
                            setEditingCompanyId(entry.company_id);
                          }}
                          className="px-2 py-1 text-accent-ai hover:bg-accent-ai/10 rounded text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2 py-1 text-warning hover:bg-warning/10 rounded text-xs font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-text-secondary">No portfolios found. Upload one to get started.</div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-foreground">Upload New Portfolio</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Client Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-surface"
                  placeholder="e.g., TechCorp Investment Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bank Tickers (comma-separated)</label>
                <textarea
                  required
                  value={tickers}
                  onChange={(e) => setTickers(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-surface font-mono text-sm"
                  placeholder="GFC, EBG, APB"
                  rows={3}
                />
                <p className="text-xs text-text-tertiary mt-1">Try: GFC, EBG, APB, CFS, YESBANK, PNB</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-surface transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
