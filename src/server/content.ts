// Public content server fn: DB first, tracked JSON fallback (build/prerender safety).
import { createServerFn } from '@tanstack/react-start';
import { getPublicContent, getSeedContent } from '../lib/content';

// Only an empty/missing DB falls back to the tracked seed. Anything else
// is a real failure: log it and rethrow instead of masking it.
const EMPTY_DB = /empty|no such table|no such file|ENOENT|does not exist/i;

// Drizzle wraps driver errors ("Failed query: ...", real reason in `cause`),
// so match against the whole chain, not just the top-level message.
function errorChainText(err: unknown): string {
  const parts: string[] = [];
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur instanceof Error; i++) {
    parts.push(cur.message);
    cur = (cur as { cause?: unknown }).cause;
  }
  return parts.join('\n');
}

export const getContentFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      return await getPublicContent();
    } catch (err) {
      const msg = err instanceof Error ? errorChainText(err) : String(err);
      if (!EMPTY_DB.test(msg)) {
        console.error(`getContentFn failed: ${msg}`);
        throw err;
      }
      console.warn(`getContentFn seed fallback: ${msg}`);
      const seed = await getSeedContent();
      return { version: 0, ...seed };
    }
  },
);
