'use client';

import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search banks, metrics..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6 ml-6">
        {/* Notifications */}
        <button className="relative text-text-secondary hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground mb-0.5">{user?.name}</p>
            {user?.role?.toLowerCase() === 'cfo' ? (
              <span className="inline-block px-2 py-0.5 bg-cfo-gold/20 text-cfo-gold font-bold text-[11px] rounded border border-cfo-gold/40 uppercase tracking-wider shadow-2xs">
                CFO
              </span>
            ) : (
              <p className="text-xs font-medium text-text-tertiary">
                {user?.role?.toLowerCase() === 'admin' ? 'Admin' : user?.role ? 'Analyst' : ''}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
            user?.role?.toLowerCase() === 'cfo'
              ? 'bg-cfo-gold/20 text-cfo-gold border border-cfo-gold/40 font-semibold'
              : 'bg-primary/10 text-primary'
          }`}>
            {user?.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
