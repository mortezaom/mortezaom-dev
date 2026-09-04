import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
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
  notFoundComponent: AdminNotFound,
});

function AdminNotFound() {
  return <Navigate to="/admin/login" replace />;
}

const TABS = [
  { to: '/admin/site', label: 'Site & SEO' },
  { to: '/admin/profile', label: 'Profile' },
  { to: '/admin/work', label: 'Work' },
  { to: '/admin/career', label: 'Career' },
] as const;

function ForceDarkTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);
  return null;
}

function AdminLayout() {
  const navigate = useNavigate();
  const logout = async () => {
    await logoutFn();
    navigate({ to: '/admin/login' });
  };
  return (
    <ThemeProvider defaultTheme="dark" storageKey="theme">
      <ForceDarkTheme />
      <div className="bg-background min-h-screen text-foreground admin-shadcn">
        <header className="top-0 z-50 sticky bg-background/90 backdrop-blur border-b">
          <div className="flex justify-between items-center gap-4 mx-auto px-6 max-w-275 h-16">
            <Link
              to="/admin/site"
              className="font-bold text-[17px] tracking-[-0.02em]"
            >
              Admin
            </Link>
            <nav
              className="flex gap-1 max-sm:gap-0 overflow-x-auto"
              aria-label="Admin sections"
            >
              {TABS.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  activeProps={{ 'aria-current': 'page' }}
                  className="px-3 py-2 font-medium text-[13px] text-muted-foreground aria-[current]:text-foreground hover:text-foreground aria-[current]:underline underline-offset-4"
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
        <main className="mx-auto px-6 py-8 max-w-275">
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
    </ThemeProvider>
  );
}
