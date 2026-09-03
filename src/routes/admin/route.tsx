import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { logoutFn, sessionFn } from '../../server/admin';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const s = await sessionFn().catch(() => ({ user: null }));
    if (!s.user && location.pathname !== '/admin/login') {
      throw redirect({ to: '/admin/login' });
    }
    return { adminUser: s.user };
  },
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  }),
  headers: () => ({
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store',
  }),
  component: AdminLayout,
});

const TABS = [
  { to: '/admin/site', label: 'Site & SEO' },
  { to: '/admin/profile', label: 'Profile' },
  { to: '/admin/work', label: 'Work' },
  { to: '/admin/career', label: 'Career' },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const logout = async () => {
    await logoutFn();
    navigate({ to: '/admin/login' });
  };
  return (
    <div className="admin-shadcn min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-4 px-6">
          <Link
            to="/admin/site"
            className="text-[17px] font-bold tracking-[-0.02em]"
          >
            Admin
          </Link>
          <nav
            className="flex gap-1 overflow-x-auto max-sm:gap-0"
            aria-label="Admin sections"
          >
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeProps={{ 'aria-current': 'page' }}
                className="px-3 py-2 text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground aria-[current]:text-foreground aria-[current]:underline"
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-[13px] text-muted-foreground hover:text-foreground"
            >
              View site
            </a>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <Suspense
          fallback={
            <p className="text-[13px] text-muted-foreground">Loading…</p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
