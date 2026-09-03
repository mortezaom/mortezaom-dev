import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { Suspense, useEffect, useState } from 'react';
import { IntroLoader } from '../components/intro-loader';
import styleCss from '../styles.css?url';

const JS_FLAG =
  "document.documentElement.classList.add('js');history.scrollRestoration='manual';const h=location.hash;if(h){document.documentElement.dataset.initialHash=h;history.replaceState(history.state,'',location.pathname+location.search)}scrollTo(0,0)";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0c0d0f' },
      { name: 'color-scheme', content: 'dark' },
    ],
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.json' },
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
  }),
  shellComponent: RootComponent,
});

function RootComponent() {
  const [introExiting, setIntroExiting] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [initialHash, setInitialHash] = useState('');
  // SSR ships content unlocked (crawlers/scrapers see it); lock only after hydration.
  const [hydrated, setHydrated] = useState(false);
  const locked = hydrated && !introComplete;

  useEffect(() => {
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
    if (!introComplete || !initialHash) return;

    const raf = requestAnimationFrame(() => {
      document.getElementById(initialHash.slice(1))?.scrollIntoView();
      setInitialHash('');
    });
    return () => cancelAnimationFrame(raf);
  }, [introComplete, initialHash]);

  return (
    <html lang="en" className="motion-safe:scroll-smooth">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans text-ink bg-bg antialiased [text-rendering:optimizeLegibility] selection:bg-ink selection:text-bg">
        {!introComplete && (
          <IntroLoader
            onExit={() => setIntroExiting(true)}
            onComplete={() => setIntroComplete(true)}
          />
        )}
        <Suspense>
          <div
            className="site-background"
            data-intro-ready={introExiting || introComplete || undefined}
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
