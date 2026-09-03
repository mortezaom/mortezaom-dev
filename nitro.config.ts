import { defineNitroConfig } from 'nitro/config';

const SECURITY_HEADERS = {
  // Clickjacking / MIME-sniffing / referrer hardening.
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Narrow CSP: same-origin + fonts + inline styles/scripts used by the app.
  // Adjust if new third-party embeds are added.
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

export default defineNitroConfig({
  routeRules: {
    '/': {
      prerender: true,
      // Short ISR window so admin saves go public fast. Every content
      // mutation bumps `content_version`, which busts the client loader
      // cache; this HTML window is the remaining staleness bound.
      isr: 60,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
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
