'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { User, Lock, Bell, LogOut } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  const roleLower = user?.role?.toLowerCase();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-text-secondary mt-1">Manage your FinSight profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
        {/* Left Column: Profile & Security */}
        <div className="space-y-6 w-full">
          {/* Profile Section */}
          <div className="bg-background border border-border rounded-xl p-6 space-y-6 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold ${
                roleLower === 'cfo' ? 'bg-cfo-gold/20 text-cfo-gold border border-cfo-gold/40' : 'bg-primary/10 text-primary'
              }`}>
                {user?.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
                <p className="text-text-secondary font-medium mt-0.5">
                  {roleLower === 'cfo' ? 'CFO' : roleLower === 'admin' ? 'Admin' : roleLower === 'analyst' ? 'Analyst' : user?.role} Account
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-foreground disabled:opacity-75 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-foreground disabled:opacity-75 font-medium"
                />
              </div>
            </div>

            <Button variant="outline" className="w-full border-border hover:bg-surface font-semibold">
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* Security Section */}
          <div className="bg-background border border-border rounded-xl p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className={`w-5 h-5 ${roleLower === 'cfo' ? 'text-cfo-gold' : 'text-primary'}`} />
              Security
            </h3>
            <p className="text-sm text-text-secondary">
              Manage your password and authentication security credentials
            </p>
            <Button variant="outline" className="w-full border-border hover:bg-surface font-semibold">
              Change Password
            </Button>
          </div>
        </div>

        {/* Right Column: Notifications & Session */}
        <div className="space-y-6 w-full">
          {/* Notifications Section */}
          <div className="bg-background border border-border rounded-xl p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell className={`w-5 h-5 ${roleLower === 'cfo' ? 'text-cfo-gold' : 'text-primary'}`} />
              Notifications
            </h3>
            <div className="space-y-3">
              {[
                { label: 'New Insights', description: 'Get notified when new AI executive insights are ready' },
                { label: 'Price & Metric Alerts', description: 'Alerts when tracked banks reach threshold limits' },
                { label: 'Weekly Summary Reports', description: 'Receive weekly automated financial audit summaries' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3.5 bg-surface rounded-lg border border-border/50">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          {/* Session Summary */}
          <div className="bg-background border border-border rounded-xl p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-bold text-foreground">Session Status</h3>
            <div className="p-4 bg-surface rounded-lg border border-border/50 space-y-2 text-sm">
              <div className="flex justify-between items-center text-text-secondary">
                <span>Last authenticated:</span>
                <span className="font-semibold text-foreground">Today at 10:30 AM</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Active concurrent sessions:</span>
                <span className="font-semibold text-foreground">1 (Current Device)</span>
              </div>
            </div>
            <Button
              onClick={logout}
              className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 font-semibold shadow-none transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out of FinSight
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
