'use client';

import { useAuth } from '@/lib/auth-context';
import { AnalystDashboard } from './analyst-dashboard';
import { CfoDashboard } from '@/components/cfo-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="w-full">
      {user?.role === 'cfo' ? <CfoDashboard /> : <AnalystDashboard />}
    </div>
  );
}
