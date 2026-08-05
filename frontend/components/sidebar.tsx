'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, Zap, Clock, Settings, LogOut, CheckCircle, Users, Database } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const analystNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/explore', label: 'Explore Banks', icon: Compass },
  { href: '/peer-comparison', label: 'Peer Analysis', icon: TrendingUp },
  { href: '/what-if', label: 'What-If Scenarios', icon: Zap },
  { href: '/account', label: 'Account', icon: Settings },
];

const cfoNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/approved', label: 'Approved History', icon: CheckCircle },
  { href: '/account', label: 'Account', icon: Settings },
];

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/portfolios', label: 'Portfolios', icon: Database },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/account', label: 'Account', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  let navItems = analystNavItems;
  if (user?.role === 'cfo') navItems = cfoNavItems;
  else if (user?.role === 'admin') navItems = adminNavItems;

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full">
      {/* Logo and Role Badge */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            FS
          </div>
          <span className="font-bold text-lg">FinSight</span>
        </div>
        {user && (
          <div className="text-xs font-semibold px-2 py-1 rounded bg-sidebar-accent text-sidebar-accent-foreground w-fit uppercase tracking-wide">
            {user.role === 'cfo' ? '👔 CFO' : user.role === 'admin' ? '⚙️ Admin' : '📊 Analyst'}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
