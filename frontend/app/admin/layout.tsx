import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { RoleGuard } from '@/components/role-guard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto p-6 sm:p-8 bg-background">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
