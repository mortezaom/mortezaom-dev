import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // Native NAPI driver (pnpm-symlinked, so Vite would inline it into the
  // server bundle where its relative .node require fails at runtime).
  // Force-external so prod resolves real node_modules (login 500 fix).
  ssr: { external: ['drizzle-orm', '@tursodatabase/database'] },
  environments: {
    ssr: {
      resolve: { external: ['drizzle-orm', '@tursodatabase/database'] },
    },
  },
  plugins: [devtools(), nitro(), tailwindcss(), tanstackStart(), react()],
});
