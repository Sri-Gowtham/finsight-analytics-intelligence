import { useState, useCallback, useEffect } from 'react';
import { Bank, Client, Scenario, CfoInsight, UserRecord, PortfolioEntry, PortfolioUploadResult, DataSourceSettings } from './types';
import { mockBanks, mockClients, mockScenarios, mockCfoInsights, MOCK_USERS, mockPortfolios, mockDataSourceSettings } from './mock-data';

export function useBanks() {
  const [data, setData] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setData(mockBanks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch banks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, []);

  return { data, isLoading, error };
}

export function useBankById(id: string) {
  const [data, setData] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBank = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const bank = mockBanks.find((b) => b.id === id);
        if (!bank) {
          throw new Error('Bank not found');
        }
        setData(bank);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bank');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [id]);

  return { data, isLoading, error };
}

export function useClients() {
  const [data, setData] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setData(mockClients);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  return { data, isLoading, error };
}

export function useScenarios(bankId?: string) {
  const [data, setData] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        const scenarios = bankId
          ? mockScenarios.filter((s) => s.bankId === bankId)
          : mockScenarios;
        setData(scenarios);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch scenarios');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScenarios();
  }, [bankId]);

  return { data, isLoading, error };
}

export function useCreateScenario() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createScenario = useCallback(async (scenario: Omit<Scenario, 'id' | 'createdDate'>) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newScenario: Scenario = {
        ...scenario,
        id: Date.now().toString(),
        createdDate: new Date(),
      };
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const scenarios = JSON.parse(localStorage.getItem('finsight-scenarios') || '[]');
        scenarios.push(newScenario);
        localStorage.setItem('finsight-scenarios', JSON.stringify(scenarios));
      }
      return newScenario;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create scenario';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createScenario, isLoading, error };
}

export function useLocalScenarios() {
  const [data, setData] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const scenarios = JSON.parse(localStorage.getItem('finsight-scenarios') || '[]');
        setData([...mockScenarios, ...scenarios]);
      } catch (err) {
        setData(mockScenarios);
      }
    }
    setIsLoading(false);
  }, []);

  return { data, isLoading };
}

// CFO Insight Hooks

export function useCfoPendingInsights() {
  const [data, setData] = useState<CfoInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const stored = localStorage.getItem('cfo-insights');
        const insights = stored ? JSON.parse(stored) : mockCfoInsights;
        const pending = insights.filter((i: CfoInsight) => i.approval_status === 'pending');
        setData(pending);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return { data, isLoading, error };
}

export function useCfoApprovedInsights() {
  const [data, setData] = useState<CfoInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const stored = localStorage.getItem('cfo-insights');
        const insights = stored ? JSON.parse(stored) : mockCfoInsights;
        const approved = insights.filter((i: CfoInsight) => i.approval_status === 'approved');
        setData(approved);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return { data, isLoading, error };
}

export function useCfoInsightById(id: string) {
  const [data, setData] = useState<CfoInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const stored = localStorage.getItem('cfo-insights');
        const insights = stored ? JSON.parse(stored) : mockCfoInsights;
        const insight = insights.find((i: CfoInsight) => i.id === id);
        if (!insight) {
          throw new Error('Insight not found');
        }
        setData(insight);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch insight');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [id]);

  return { data, isLoading, error };
}

export function useApproveInsight() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (insightId: string) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cfo-insights');
        const insights = stored ? JSON.parse(stored) : mockCfoInsights;
        const updated = insights.map((i: CfoInsight) =>
          i.id === insightId
            ? { ...i, approval_status: 'approved', approved_at: new Date() }
            : i
        );
        localStorage.setItem('cfo-insights', JSON.stringify(updated));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve insight';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { approve, isLoading, error };
}

export function useRejectInsight() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reject = useCallback(async (insightId: string, reason?: string) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cfo-insights');
        const insights = stored ? JSON.parse(stored) : mockCfoInsights;
        const updated = insights.map((i: CfoInsight) =>
          i.id === insightId
            ? { 
                ...i, 
                approval_status: 'rejected',
                rejected_at: new Date(),
                rejection_reason: reason
              }
            : i
        );
        localStorage.setItem('cfo-insights', JSON.stringify(updated));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject insight';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { reject, isLoading, error };
}

// Admin Hooks

export function useUsers() {
  const [data, setData] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const stored = localStorage.getItem('admin-users');
        const users = stored ? JSON.parse(stored) : MOCK_USERS;
        setData(users.map(({ password: _, ...u }: any) => u));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { data, isLoading, error };
}

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (userData: { name: string; email: string; role: 'analyst' | 'cfo' | 'admin'; password: string }) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin-users');
        const users = stored ? JSON.parse(stored) : MOCK_USERS;
        const newUser = {
          id: String(users.length + 1),
          ...userData,
          is_active: true,
        };
        users.push(newUser);
        localStorage.setItem('admin-users', JSON.stringify(users));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

export function useDeactivateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivate = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin-users');
        const users = stored ? JSON.parse(stored) : MOCK_USERS;
        const updated = users.map((u: any) =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u
        );
        localStorage.setItem('admin-users', JSON.stringify(updated));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deactivate, isLoading, error };
}

export function usePortfolios() {
  const [data, setData] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const stored = localStorage.getItem('portfolios');
        setData(stored ? JSON.parse(stored) : mockPortfolios);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch portfolios');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  return { data, isLoading, error };
}

export function useUploadPortfolio() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (clientName: string, bankTickers: string[]): Promise<PortfolioUploadResult> => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const failedTickers: string[] = [];
      const insertedEntries: PortfolioEntry[] = [];
      let skippedDuplicates = 0;

      const stored = localStorage.getItem('portfolios');
      const existing = stored ? JSON.parse(stored) : mockPortfolios;

      for (const ticker of bankTickers) {
        const bank = mockBanks.find((b) => b.ticker === ticker);
        if (!bank) {
          failedTickers.push(ticker);
          continue;
        }

        const duplicate = existing.some(
          (p: PortfolioEntry) => p.client_name === clientName && p.company_id === bank.id
        );
        if (duplicate) {
          skippedDuplicates++;
          continue;
        }

        insertedEntries.push({
          id: `p${Date.now()}_${Math.random()}`,
          client_name: clientName,
          company_id: bank.id,
          bank_name: bank.name,
          ticker: bank.ticker,
          uploaded_by: 'Priya Nair',
        });
      }

      if (insertedEntries.length > 0) {
        const updated = [...existing, ...insertedEntries];
        localStorage.setItem('portfolios', JSON.stringify(updated));
      }

      return {
        success: true,
        client_name: clientName,
        inserted_count: insertedEntries.length,
        skipped_duplicates: skippedDuplicates,
        failed_tickers: failedTickers,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload portfolio';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { upload, isLoading, error };
}

export function useUpdatePortfolioEntry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, newCompanyId: string) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('portfolios');
        const entries = stored ? JSON.parse(stored) : mockPortfolios;
        const bank = mockBanks.find((b) => b.id === newCompanyId);
        if (!bank) throw new Error('Bank not found');

        const updated = entries.map((e: PortfolioEntry) =>
          e.id === id
            ? { ...e, company_id: newCompanyId, bank_name: bank.name, ticker: bank.ticker }
            : e
        );
        localStorage.setItem('portfolios', JSON.stringify(updated));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update portfolio entry';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

export function useDeletePortfolioEntry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_entry = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('portfolios');
        const entries = stored ? JSON.parse(stored) : mockPortfolios;
        const updated = entries.filter((e: PortfolioEntry) => e.id !== id);
        localStorage.setItem('portfolios', JSON.stringify(updated));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete portfolio entry';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { delete_entry, isLoading, error };
}

export function useDataSourceSettings() {
  const [data, setData] = useState<DataSourceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        const stored = localStorage.getItem('data-source-settings');
        setData(stored ? JSON.parse(stored) : mockDataSourceSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { data, isLoading, error };
}

export function useUpdateDataSourceSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (apiKey: string, testConnection: boolean = false) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, testConnection ? 1500 : 600));

      if (typeof window !== 'undefined') {
        const success = testConnection ? Math.random() > 0.3 : true;
        const settings: DataSourceSettings = {
          api_key: apiKey,
          last_connection_test: testConnection ? new Date() : null,
          connection_status: testConnection ? (success ? 'connected' : 'disconnected') : 'connected',
        };
        localStorage.setItem('data-source-settings', JSON.stringify(settings));
        return { success, status: settings.connection_status };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}
