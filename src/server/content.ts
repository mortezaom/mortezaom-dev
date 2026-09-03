// Public content server fn: DB first, tracked JSON fallback (build/prerender safety).
import { createServerFn } from '@tanstack/react-start';
import { getPublicContent, getSeedContent } from '../lib/content';

// Only an empty/missing DB falls back to the tracked seed. Anything else
// is a real failure: log it and rethrow instead of masking it.
const EMPTY_DB = /empty|no such table|no such file|ENOENT|does not exist/i;

export const getContentFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      return await getPublicContent();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
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
