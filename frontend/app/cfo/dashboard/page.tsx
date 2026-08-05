'use client';

import { useAuth } from '@/lib/auth-context';
import { AnalystDashboard } from '@/app/analyst/dashboard/analyst-dashboard';
import { CfoDashboard } from '@/components/cfo-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {user?.role === 'cfo' ? <CfoDashboard /> : <AnalystDashboard />}
    </div>
  );
}
