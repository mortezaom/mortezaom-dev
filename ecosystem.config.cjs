// Production process file. No secrets here — everything sensitive comes
// from `.env` (gitignored, see `.env.example`). Run from the repo root:
//   pnpm run build && pm2 start ecosystem.config.cjs
//
// `.env` is loaded below so PORT/HOST/etc. set there are respected.
// Shell env still wins over `.env` (dotenv never overrides existing vars).
const { resolve } = require('node:path');
const { config } = require('dotenv');

// Pin to the repo root so this works no matter where `pm2 start` runs.
config({ path: resolve(__dirname, '.env') });
module.exports = {
  apps: [
    {
      name: 'mortezaom',
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      // SQLite lives on disk: single writer only, never cluster.
      instances: 1,
      env: {
        // Required in production: enables Secure session cookies.
        NODE_ENV: 'production',
        // Bind loopback; terminate TLS in nginx/Caddy/etc.
        HOST: process.env.HOST ?? '127.0.0.1',
        PORT: process.env.PORT ?? '3000',
      },
      max_memory_restart: '1G',
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },
  ],
};
