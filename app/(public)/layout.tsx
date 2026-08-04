import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Public Navigation */}
      <nav className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              FS
            </div>
            <span className="font-bold text-lg">FinSight</span>
          </Link>
          <Link href="/login">
            <Button variant="default">Log In</Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  FS
                </div>
                <span className="font-bold">FinSight</span>
              </div>
              <p className="text-sm text-text-secondary">
                AI-powered financial insights from verified data.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-text-secondary hover:text-primary transition">
                    Log In
                  </Link>
                </li>
                <li>
                  <span className="text-text-secondary">Pricing</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-text-secondary">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-text-secondary">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-text-secondary">
            <p>&copy; 2026 FinSight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
