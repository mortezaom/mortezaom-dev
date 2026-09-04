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
  "document.documentElement.classList.add('js');history.scrollRestoration='manual';const h=location.hash;if(h){document.documentElement.dataset.initialHash=h;history.replaceState(history.state,'',location.pathname+location.search)}scrollTo(0,0)";

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

/** Same-page section id for an anchor, else null. */
function getSamePageHashId(link: HTMLAnchorElement): string | null {
  const raw = link.getAttribute('href');
  if (!raw) return null;
  if (link.target && link.target !== '_self') return null;
  if (link.origin !== location.origin) return null;
  let url: URL;
  try {
    url = new URL(link.href, location.href);
  } catch {
    return null;
  }
  if (!url.hash) return null;
  if (url.pathname !== location.pathname || url.search !== location.search)
    return null;
  try {
    return decodeURIComponent(url.hash.slice(1));
  } catch {
    return url.hash.slice(1);
  }
}

function scrollToSection(id: string) {
  if (!id) {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(
      history.state,
      '',
      `${location.pathname}${location.search}`,
    );
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  if (id === 'main' && !target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  history.replaceState(
    history.state,
    '',
    `${location.pathname}${location.search}`,
  );
}

/** Defer past the mobile menu's body-overflow unlock. */
function scheduleSectionScroll(id: string) {
  const menuOpen =
    document.body.style.overflow === 'hidden' ||
    document.getElementById('mobile-menu')?.getAttribute('aria-hidden') ===
      'false';
  if (!menuOpen) {
    requestAnimationFrame(() => scrollToSection(id));
    return;
  }
  window.setTimeout(() => {
    requestAnimationFrame(() => scrollToSection(id));
  }, 80);
}

/**
 * Runs the admin-pasted tracking tag. Scripts recreated via createElement:
 * tags placed through innerHTML never execute.
 */
function TrackingSnippet({ snippet }: { snippet: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
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
  }, [snippet]);

  return <div ref={hostRef} aria-hidden="true" />;
}

function RootComponent() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const tracking = Route.useLoaderData();
  const isAdmin = pathname.startsWith('/admin');
  const [introExiting, setIntroExiting] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [initialHash, setInitialHash] = useState('');
  // SSR ships unlocked for crawlers; lock only after hydration.
  const [hydrated, setHydrated] = useState(false);
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
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const id = getSamePageHashId(link);
      if (id === null) return;

      event.preventDefault();

      // Intro locks scrolling; queue for after it.
      if (document.querySelector('.intro-loader')) {
        document.documentElement.dataset.pendingHash = `#${id}`;
        return;
      }

      scheduleSectionScroll(id);
    };

    const onHashChange = () => {
      const raw = location.hash;
      if (!raw) return;
      // Back/forward + manual hash edits.
      scrollToSection(raw.slice(1));
    };

    document.addEventListener('click', navigateToSection);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      document.removeEventListener('click', navigateToSection);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    if (!introComplete || isAdmin) return;
    const pending = document.documentElement.dataset.pendingHash;
    delete document.documentElement.dataset.pendingHash;
    const hash = pending || initialHash;
    if (!hash) return;

    const raf = requestAnimationFrame(() => {
      scrollToSection(hash.slice(1));
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
        {!isAdmin && tracking?.snippet && (
          <TrackingSnippet snippet={tracking.snippet} />
        )}
      </body>
    </html>
  );
}
