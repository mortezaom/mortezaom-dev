// oxlint-disable-next-line import/no-unassigned-import -- dotenv side-effect import loads .env
import 'dotenv/config';
import { isAbsolute, resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';

const dbFile = process.env.DB_FILE_NAME ?? './data/portfolio.db';

// Embedded file → sqlite dialect ('turso' is the remote path).
export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: isAbsolute(dbFile) ? dbFile : resolve(process.cwd(), dbFile),
  },
});
