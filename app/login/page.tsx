'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@finsight.demo');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
            FS
          </div>
          <h1 className="text-3xl font-bold text-foreground">FinSight</h1>
          <p className="text-text-secondary mt-2">Banking Intelligence Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-background border border-border rounded-2xl p-8 space-y-6 shadow-sm">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-center text-xs font-semibold text-foreground">Demo Credentials</p>
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">
                <span className="font-mono text-primary font-bold">analyst@finsight.demo</span>
                <br />
                <span className="text-text-tertiary text-xs">(Analyst role)</span>
              </p>
              <p className="text-xs text-text-secondary">
                <span className="font-mono text-primary font-bold">cfo@finsight.demo</span>
                <br />
                <span className="text-text-tertiary text-xs">(CFO role)</span>
              </p>
              <p className="text-xs text-text-secondary">
                <span className="font-mono text-primary font-bold">admin@finsight.demo</span>
                <br />
                <span className="text-text-tertiary text-xs">(Admin role)</span>
              </p>
              <div className="pt-2 border-t border-primary/20">
                <p className="text-xs text-text-secondary">
                  Password: <span className="font-mono text-primary font-bold">demo1234</span>
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-text-tertiary mt-6">
          © 2025 FinSight. All rights reserved.
        </p>
      </div>
    </div>
  );
}
