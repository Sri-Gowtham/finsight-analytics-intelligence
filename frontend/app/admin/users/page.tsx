'use client';

import { useState } from 'react';
import { useUsers, useCreateUser, useDeactivateUser } from '@/lib/hooks';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <UsersContent />
    </RoleGuard>
  );
}

function UsersContent() {
  const { data: users, isLoading } = useUsers();
  const { create } = useCreateUser();
  const { deactivate } = useDeactivateUser();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'analyst' as const, password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await create(formData as any);
      setFormData({ name: '', email: '', role: 'analyst', password: '' });
      setShowModal(false);
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (confirm('Toggle active status for this user?')) {
      await deactivate(userId);
      window.location.reload();
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-text-secondary mt-1">Create and manage system users</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
        >
          <Plus className="w-5 h-5" />
          Create User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-secondary">Loading users...</div>
        ) : users && users.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeactivate(user.id)}
                      className="px-3 py-1 text-xs font-medium text-warning hover:bg-warning/10 rounded transition-colors"
                    >
                      {user.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-text-secondary">No users found</div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-foreground">Create New User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-surface"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-surface"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-surface"
                >
                  <option value="analyst">Analyst</option>
                  <option value="cfo">CFO</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-surface"
                  placeholder="Enter temporary password"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-surface transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
