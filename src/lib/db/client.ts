// Server-only: the native binding must never load in the client bundle.
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/tursodatabase/database';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | undefined;

/** Absolute DB path, independent of cwd. */
export function getDbFile(): string {
  const raw = process.env.DB_FILE_NAME ?? './data/portfolio.db';
  return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
}

export function getDb() {
  if (!db) {
    // Fail with a clear migration error instead of a native ENOENT.
    mkdirSync(dirname(getDbFile()), { recursive: true });
    db = drizzle(getDbFile());
  }
  return db;
}

export { schema };
