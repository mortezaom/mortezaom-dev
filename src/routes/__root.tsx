import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from '@tanstack/react-router';
import { Suspense, useEffect, useState } from 'react';
import { IntroLoader } from '../components/intro-loader';
import { SiteNotFound } from '../components/site-not-found';
import styleCss from '../styles.css?url';

const JS_FLAG =
  "document.documentElement.classList.add('js');history.scrollRestoration='manual';const h=location.hash;if(h){document.documentElement.dataset.initialHash=h;history.replaceState(history.state,'',location.pathname+location.search)}scrollTo(0,0)";

export const Route = createRootRoute({
  head: ({ matches }) => {
    // Global 404s surface as the root match with `_notFound` (status stays
    // "success"); nested 404s surface as a match with status "notFound".
    const isNotFound = matches.some(
      // oxlint-disable-next-line no-underscore-dangle -- _notFound is TanStack Router's own match flag
      (m) => m.status === 'notFound' || m._notFound,
    );
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#050505' },
        { name: 'color-scheme', content: 'dark' },
        ...(isNotFound
          ? [
              { title: 'Page not found — Morteza Omar Mohammadi' },
              {
                name: 'description',
                content: "The page you're looking for doesn't exist.",
              },
              { name: 'robots', content: 'noindex, nofollow' },
              { property: 'og:title', content: 'Page not found' },
              {
                property: 'og:description',
                content: "The page you're looking for doesn't exist.",
              },
            ]
          : []),
      ],
      links: [
        { rel: 'stylesheet', href: styleCss },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          href: '/favicon-96x96.png',
        },
        {
          rel: 'icon',
          href: '/favicon.svg',
          type: 'image/svg+xml',
          sizes: 'any',
        },
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Elms+Sans:ital,wght@0,100..900;1,100..900&family=Syne:wght@400..800&display=swap',
        },
      ],
      scripts: [{ children: JS_FLAG }],
    };
  },
  shellComponent: RootComponent,
  notFoundComponent: SiteNotFound,
  headers: ({ matches }) =>
    // oxlint-disable-next-line no-underscore-dangle -- _notFound is TanStack Router's own match flag
    matches.some((m) => m.status === 'notFound' || m._notFound)
      ? {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        }
      : undefined,
});

function RootComponent() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const isAdmin = pathname.startsWith('/admin');
  const [introExiting, setIntroExiting] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [initialHash, setInitialHash] = useState('');
  // SSR ships content unlocked (crawlers/scrapers see it); lock only after hydration.
  const [hydrated, setHydrated] = useState(false);
  // Admin panel never shows the intro.
  const locked = hydrated && !introComplete && !isAdmin;

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- hydration flag: SSR ships unlocked, lock only after mount
    setHydrated(true);
    setInitialHash(document.documentElement.dataset.initialHash ?? '');
    delete document.documentElement.dataset.initialHash;
    window.scrollTo(0, 0);

    const navigateToSection = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const link = (event.target as Element).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!link) return;

      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView();
      history.replaceState(
        history.state,
        '',
        `${location.pathname}${location.search}`,
      );
    };

    document.addEventListener('click', navigateToSection);
    return () => document.removeEventListener('click', navigateToSection);
  }, []);

  useEffect(() => {
    if (!introComplete || !initialHash || isAdmin) return;

    const raf = requestAnimationFrame(() => {
      document.getElementById(initialHash.slice(1))?.scrollIntoView();
      setInitialHash('');
    });
    return () => cancelAnimationFrame(raf);
  }, [introComplete, initialHash, isAdmin]);

  return (
    <html
      lang="en"
      className="motion-safe:scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg selection:bg-ink font-sans text-ink selection:text-bg antialiased [text-rendering:optimizeLegibility]">
        {!isAdmin && !introComplete && (
          <IntroLoader
            onExit={() => setIntroExiting(true)}
            onComplete={() => setIntroComplete(true)}
          />
        )}
        <Suspense>
          <div
            className="site-background"
            data-intro-ready={
              isAdmin || introExiting || introComplete || undefined
            }
            inert={locked || undefined}
            aria-hidden={locked ? 'true' : undefined}
          >
            <Outlet />
          </div>
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
