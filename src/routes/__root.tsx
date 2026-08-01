import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/solid-router';
import { createEffect, createSignal, onCleanup, onMount, Show, Suspense } from 'solid-js';
import { HydrationScript } from 'solid-js/web';
import { IntroLoader } from '../components/intro-loader';
import styleCss from '../styles.css?url';

const SITE = 'https://mortezaom.dev';
const TITLE = 'Morteza Omar Mohammadi — Full-Stack Software Engineer';
const DESC =
  'Full-stack software engineer leading production web and mobile products across backend services, payments, React, Node.js, and Flutter.';
const SOCIAL_DESC =
  'I build and lead reliable web and mobile products from backend services to production release.';

/* Social scrapers are unreliable on WebP — LinkedIn in particular. The page
   itself uses the WebP pair below; only the share card stays JPEG. */
const OG_IMAGE = `${SITE}/morteza-og.jpg`;

const JS_FLAG =
  "document.documentElement.classList.add('js');history.scrollRestoration='manual';const h=location.hash;if(h){document.documentElement.dataset.initialHash=h;history.replaceState(history.state,'',location.pathname+location.search)}scrollTo(0,0)";

const PROFILE_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: SITE,
  mainEntity: {
    '@type': 'Person',
    name: 'Morteza Omar Mohammadi',
    alternateName: 'mortezaom',
    url: SITE,
    image: OG_IMAGE,
    jobTitle: 'Full-Stack Software Engineer',
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Herat University' },
    sameAs: [
      'https://github.com/mortezaom',
      'https://linkedin.com/in/mortezaom',
      'https://x.com/mortezaaom',
    ],
  },
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: TITLE },
      { name: 'description', content: DESC },
      { name: 'author', content: 'Morteza Omar Mohammadi' },
      { name: 'theme-color', content: '#0c0d0f' },
      { name: 'color-scheme', content: 'dark' },
      { property: 'og:type', content: 'profile' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: SOCIAL_DESC },
      { property: 'og:url', content: SITE },
      { property: 'og:image', content: OG_IMAGE },
      {
        property: 'og:image:alt',
        content: 'Portrait of Morteza Omar Mohammadi',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:creator', content: '@mortezaaom' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: SOCIAL_DESC },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'canonical', href: SITE },
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
    scripts: [
      { children: JS_FLAG },
      { type: 'application/ld+json', children: JSON.stringify(PROFILE_LD) },
    ],
  }),
  shellComponent: RootComponent,
});

function RootComponent() {
  const [introExiting, setIntroExiting] = createSignal(false);
  const [introComplete, setIntroComplete] = createSignal(false);
  const [initialHash, setInitialHash] = createSignal('');

  onMount(() => {
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
    onCleanup(() => document.removeEventListener('click', navigateToSection));
  });

  createEffect(() => {
    const hash = initialHash();
    if (!introComplete() || !hash) return;

    requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      setInitialHash('');
    });
  });

  return (
    <html lang="en" class="motion-safe:scroll-smooth">
      <head>
        <HydrationScript />
        <HeadContent />
      </head>
      <body class="font-sans text-ink bg-bg antialiased [text-rendering:optimizeLegibility] selection:bg-ink selection:text-bg">
        <Show when={!introComplete()}>
          <IntroLoader
            onExit={() => setIntroExiting(true)}
            onComplete={() => setIntroComplete(true)}
          />
        </Show>
        <Suspense>
          <div
            class="site-background"
            data-intro-ready={introExiting() || introComplete() || undefined}
            inert={!introComplete()}
            aria-hidden={!introComplete() ? 'true' : undefined}
          >
            <Outlet />
          </div>
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
