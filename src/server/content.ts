// DB first, tracked JSON fallback for build/prerender.
import { createServerFn } from '@tanstack/react-start';
import { getPublicContent, getSeedContent } from '../lib/content';

// Only an empty/missing DB (or an unloadable native driver) falls back;
// anything else rethrows.
const EMPTY_DB =
  /empty|no such table|no such file|ENOENT|does not exist|native binding|failed to load native/i;

// Drizzle nests the real reason in `cause`; match the whole chain.
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

// Tracking snippet for public pages. Never throws: null disables tracking.
export const getTrackingSnippetFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ snippet: string | null }> => {
    const snippet = await getPublicContent()
      .then((c) => c.site.trackingSnippet)
      .catch(() => null);
    if (snippet) return { snippet };
    const seed = await getSeedContent().catch(() => null);
    return { snippet: seed?.site.trackingSnippet ?? null };
  },
);
