'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, Zap, Settings, LogOut, CheckCircle, Users, Database } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const analystNavItems = [
  { href: '/analyst/dashboard', label: 'Dashboard', icon: Home },
  { href: '/analyst/explore', label: 'Explore Banks', icon: Compass },
  { href: '/analyst/peer-comparison', label: 'Peer Analysis', icon: TrendingUp },
  { href: '/analyst/what-if', label: 'What-If Scenarios', icon: Zap },
  { href: '/account', label: 'Account', icon: Settings },
];

const cfoNavItems = [
  { href: '/cfo/dashboard', label: 'Dashboard', icon: Home },
  { href: '/cfo/approved', label: 'Approved History', icon: CheckCircle },
  { href: '/account', label: 'Account', icon: Settings },
];

const adminNavItems = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/portfolios', label: 'Portfolios', icon: Database },
  { href: '/account', label: 'Account', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const roleLower = user?.role?.toLowerCase();
  let navItems = analystNavItems;
  if (roleLower === 'cfo') navItems = cfoNavItems;
  else if (roleLower === 'admin') navItems = adminNavItems;

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full">
      {/* Logo and Role Badge */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
            roleLower === 'cfo' ? 'bg-cfo-gold text-white font-extrabold shadow-xs' : 'bg-sidebar-primary'
          }`}>
            FS
          </div>
          <span className="font-bold text-lg">FinSight</span>
        </div>
        {user && (
          <div className={`text-xs font-semibold px-2.5 py-1 rounded w-fit uppercase tracking-wide border transition-all ${
            roleLower === 'cfo'
              ? 'bg-cfo-gold/20 text-cfo-gold border-cfo-gold/50 font-bold shadow-2xs'
              : roleLower === 'admin'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border'
              : 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border'
          }`}>
            {roleLower === 'cfo' ? '👔 CFO' : roleLower === 'admin' ? '⚙️ Admin' : '📊 Analyst'}
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
                  ? roleLower === 'cfo'
                    ? 'bg-cfo-gold/15 text-cfo-gold font-bold border-l-4 border-cfo-gold'
                    : 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
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
