import { defineNitroConfig } from 'nitro/config';

const SECURITY_HEADERS = {
  // Clickjacking / MIME-sniffing / referrer hardening.
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Same-origin + fonts + inline styles/scripts. Extend for new embeds.
  // Dashboard tracking snippets with external hosts need allowlisting here.
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://umami.mortezaom.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://umami.mortezaom.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

export default defineNitroConfig({
  // Native NAPI driver: bundling it breaks the relative .node require, so
  // the .output server 500s ("Cannot find native binding"). Trace keeps it
  // external and ships the binding into .output (login 500 fix).
  traceDeps: ['drizzle-orm', '@tursodatabase/database'],
  routeRules: {
    '/': {
      // Dynamic SSR + SWR: prerender would freeze admin content, and `isr`
      // is Vercel/Netlify-only.
      swr: 60,
      headers: {
        'Cache-Control':
          'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
        ...SECURITY_HEADERS,
      },
    },
    '/admin/**': {
      prerender: false,
      cache: false,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
        ...SECURITY_HEADERS,
      },
    },
    '/assets/**': {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  },
});
