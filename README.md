# mortezaom.dev — portfolio + CMS

Single-page portfolio (TanStack Start, React 19, Tailwind v4, shadcn) with
all page content in an embedded Turso DB (`DB_FILE_NAME`, default
`./data/portfolio.db`) via `drizzle-orm@1.0.0-rc.4` + `@tursodatabase/database`.
`content/portfolio.json` is the git-tracked source of truth — seed and backup
format for both the CLI and the admin panel.

Stack: TanStack Start/Router + Vite 8, Nitro 3 (Node server), Drizzle +
sqlite dialect, `oxlint` + `oxfmt`.

## Setup

```bash
pnpm install
cp .env.example .env   # then fill ADMIN_* + SITE_URL below
pnpm cms:hash-password              # interactive prompt -> paste as ADMIN_PASSWORD_HASH
pnpm db:migrate                     # create/migrate data/portfolio.db
pnpm cms:import                      # seed DB from content/portfolio.json
pnpm dev                             # vite dev on :3000
```

`cms:hash-password` also accepts `--password <pw>` (warns: leaks to shell
history) or `ADMIN_PASSWORD` env. Hash format is scrypt `salt:key` (hex) —
never plaintext.

Required env (`DB_FILE_NAME`, `SITE_URL`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` 32+ chars). See `.env.example`.

## CLI

```bash
pnpm cms:import [--file <path>] [--dry-run]  # validate + replace-all content
pnpm cms:export [--file <path>]              # dump DB -> JSON (byte-stable)
pnpm cms:hash-password [--password <pw>]     # scrypt salt:key hash
pnpm db:migrate                              # apply drizzle/ migrations
pnpm db:generate                             # new migration from schema changes
pnpm db:push                                 # dev-only direct schema push (script already passes --force)
pnpm db:studio                               # drizzle-kit studio
```

`cms:import` auto-migrates, then regenerates `public/sitemap.xml` +
`public/robots.txt` from `site.siteUrl`. Saving **Site** in the admin panel
does the same. `cms:export` defaults to `content/portfolio.json`.

## Admin panel

`/admin/login` → redirects to `/admin/site`. Env single admin, 12h signed
`httpOnly` (`SameSite=lax`, `Secure` in prod) cookie + same-origin CSRF check.
5 failed logins per IP+user → 15min lockout.

4 sections:

- **Site & SEO** — identity/meta/links + JSON import/export (dry-run,
  pre-import backup to tmpdir + DB dir)
- **Profile** — hero/about/contact fields + `about` section header + stats
- **Work** — `spotlight`/`engineering`/`archive` projects + 3 section headers
- **Career** — experience + skill groups + 2 section headers

Every save bumps `content_version`, clears the server content cache
(`getPublicContent` memo keyed on version); `/` picks it up on next ISR
window / loader `staleTime` expiry. Hrefs validated: relative, `#anchor`,
`http(s)`, `mailto:` only.

## Caching / rendering

- `/`: prerendered + ISR 60s (`Cache-Control: public, s-maxage=60,
stale-while-revalidate=600`, see `nitro.config.ts` + `src/routes/index.tsx`
  `headers`). Client loader `staleTime` 5min, `gcTime` 30min.
- `/admin/**`: SSR-only, `no-store` + `noindex, nofollow`
  (`X-Robots-Tag` header + meta).
- Empty/missing DB at runtime falls back to tracked `content/portfolio.json`
  (build/prerender safety); any other DB error throws.

## Deploy (VPS, Node)

```bash
pnpm build
pnpm start   # node .output/server/index.mjs, run from repo root
```

Keep `data/` on a persistent volume. Back up `data/portfolio.db` +
`content/portfolio.json` (embedded Turso is beta — JSON is the restorable
truth). Security headers + CSP live in `nitro.config.ts`.

## Linting & formatting

```bash
pnpm lint
pnpm format
pnpm check   # oxfmt --check + oxlint --deny-warnings
```
