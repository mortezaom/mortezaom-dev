import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from '@tanstack/react-router';
import { Suspense, useEffect, useRef, useState } from 'react';
import { IntroLoader } from '../components/intro-loader';
import { SiteNotFound } from '../components/site-not-found';
import { getTrackingSnippetFn } from '../server/content';
import styleCss from '../styles.css?url';

const JS_FLAG =
  "document.documentElement.classList.add('js');history.scrollRestoration='manual';scrollTo(0,0)";

export const Route = createRootRoute({
  head: ({ matches }) => {
    // Root 404s flag `_notFound`; nested ones use status "notFound".
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
  loader: () => getTrackingSnippetFn(),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
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

/** Admin tracking tag: reinject scripts via createElement so they execute. */
function TrackingSnippet({ snippet }: { snippet: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (host.dataset.snippet === snippet) return;
    host.innerHTML = '';
    const tpl = document.createElement('template');
    tpl.innerHTML = snippet;
    for (const node of Array.from(tpl.content.querySelectorAll('script'))) {
      const el = document.createElement('script');
      for (const attr of Array.from(node.attributes))
        el.setAttribute(attr.name, attr.value);
      el.text = node.text;
      node.replaceWith(el);
    }
    host.append(tpl.content);
    host.dataset.snippet = snippet;
  }, [snippet]);

  return (
    <div
      ref={hostRef}
      data-snippet={snippet}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}

function RootComponent() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const tracking = Route.useLoaderData();
  const isAdmin = pathname.startsWith('/admin');
  const [introExiting, setIntroExiting] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  // SSR ships unlocked for crawlers; lock only after hydration.
  const [hydrated, setHydrated] = useState(false);
  const locked = hydrated && !introComplete && !isAdmin;

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- hydration flag: SSR ships unlocked, lock only after mount
    setHydrated(true);
    window.scrollTo(0, 0);
  }, []);

  // Deep links: intro locks scrolling, so jump after it.
  useEffect(() => {
    if (!introComplete || isAdmin) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(raf);
  }, [introComplete, isAdmin]);

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
            aria-hidden={locked ? 'true' : undefined}
          >
            <Outlet />
          </div>
        </Suspense>
        <Scripts />
        {!isAdmin && tracking?.snippet && (
          <TrackingSnippet snippet={tracking.snippet} />
        )}
      </body>
    </html>
  );
}
