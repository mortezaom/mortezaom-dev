import 'dotenv/config';
import { isAbsolute, resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';

const dbFile = process.env.DB_FILE_NAME ?? './data/portfolio.db';

// Local embedded Turso file → sqlite dialect (NOT 'turso'; that is the remote path).
export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: isAbsolute(dbFile) ? dbFile : resolve(process.cwd(), dbFile),
  },
});
