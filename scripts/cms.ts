import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/tursodatabase/migrator';
import { getDb } from '../src/lib/db/client';
import {
  exportSeedObject,
  hashPassword,
  importValidated,
  stringifySeed,
  validateSeed,
  writeSeoFiles,
} from '../src/lib/cms-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_JSON = resolve(ROOT, 'content/portfolio.json');
const MIGRATIONS_FOLDER = resolve(ROOT, 'drizzle');

function dbFile() {
  return resolve(ROOT, process.env.DB_FILE_NAME ?? './data/portfolio.db');
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function flag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  if (cmd === 'import') {
    const file = arg('--file') ?? DEFAULT_JSON;
    const json = JSON.parse(await readFile(file, 'utf8')) as unknown;
    const validated = validateSeed(json);
    if (flag('--dry-run')) {
      console.log(`Dry run OK: ${file}`);
      console.table(validated.counts);
      return;
    }
    await mkdir(dirname(dbFile()), { recursive: true });
    await migrate(getDb(), { migrationsFolder: MIGRATIONS_FOLDER });
    await importValidated(validated);
    try {
      await writeSeoFiles(validated.siteRow.siteUrl);
    } catch (err) {
      console.warn(
        `SEO files skipped: ${err instanceof Error ? err.message : err}`,
      );
    }
    console.log(`Imported ${file} → ${dbFile()}`);
    console.table(validated.counts);
  } else if (cmd === 'export') {
    const file = arg('--file') ?? DEFAULT_JSON;
    const out = await exportSeedObject();
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${stringifySeed(out)}\n`);
    console.log(`Exported ${dbFile()} → ${file}`);
  } else if (cmd === 'migrate') {
    await mkdir(dirname(dbFile()), { recursive: true });
    await migrate(getDb(), { migrationsFolder: MIGRATIONS_FOLDER });
    console.log(`Migrated ${dbFile()}`);
  } else if (cmd === 'hash-password') {
    let pw = arg('--password') ?? process.env.ADMIN_PASSWORD;
    if (arg('--password')) {
      console.warn(
        'Warning: --password leaks to shell history and process lists. Prefer the interactive prompt or ADMIN_PASSWORD env.',
      );
    } else if (!pw) {
      pw = await promptHidden('Admin password: ');
    }
    if (!pw) throw new Error('No password provided');
    console.log(await hashPassword(pw));
  } else {
    console.log(
      'Usage: cms <import|export|migrate|hash-password> [--file <path>] [--dry-run]',
    );
    process.exit(1);
  }
}

/** Read a line from stdin (used for passwords; avoids history/ps leaks). */
function promptHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(prompt);
    stdin.setEncoding('utf8');
    stdin.resume();
    const onData = (chunk: string) => {
      stdin.pause();
      stdin.removeListener('data', onData);
      resolve(chunk.replace(/[\r\n]+$/, ''));
    };
    stdin.on('data', onData);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
