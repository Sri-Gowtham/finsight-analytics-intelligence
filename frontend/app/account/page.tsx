'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { User, Lock, Bell, LogOut } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-text-secondary mt-1">Manage your FinSight profile and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl">
            {user?.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-text-secondary capitalize">{user?.role} Account</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              value={user?.name}
              disabled
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground disabled:opacity-50"
            />
          </div>
        </div>

        <Button variant="outline" className="w-full">
          <User className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Security Section */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Security
        </h3>
        <p className="text-sm text-text-secondary">
          Manage your password and security settings
        </p>
        <Button variant="outline" className="w-full">
          Change Password
        </Button>
      </div>

      {/* Notifications Section */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <div className="space-y-3">
          {[
            { label: 'New Insights', description: 'Get notified when new AI insights are available' },
            { label: 'Price Alerts', description: 'Alerts when tracked banks reach target prices' },
            { label: 'Weekly Summary', description: 'Receive weekly analysis summaries' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.description}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border" />
            </div>
          ))}
        </div>
      </div>

      {/* Session Summary */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Session</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>Last login: Today at 10:30 AM</p>
          <p>Active sessions: 1</p>
        </div>
        <Button
          onClick={logout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
