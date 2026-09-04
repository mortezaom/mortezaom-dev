// Secrets come from gitignored `.env`. Run from repo root:
//   pnpm run build && pm2 start ecosystem.config.cjs
const { resolve } = require('node:path');
const { config } = require('dotenv');

// Works no matter where `pm2 start` runs.
config({ path: resolve(__dirname, '.env') });
module.exports = {
  apps: [
    {
      name: 'mortezaom',
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      // SQLite: single writer, never cluster.
      instances: 1,
      env: {
        // Enables Secure session cookies.
        NODE_ENV: 'production',
        // Loopback only; TLS terminates in nginx/Caddy/etc.
        HOST: process.env.HOST ?? '127.0.0.1',
        PORT: process.env.PORT ?? '3000',
      },
      max_memory_restart: '1G',
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },
  ],
};
