/**
 * GET /api/list
 *
 * Emits every object in the bucket as compact JSON. The client paginates,
 * filters, searches and sorts against this in memory, so page navigation costs
 * no further requests.
 */

import { classify } from '../lib/classify.js';
import { isThumbKey } from '../lib/keys.js';

const R2_LIST_MAX = 1000;

/**
 * Reads the entire bucket, following cursors.
 *
 * bucket.list() returns at most 1000 objects and reports `truncated`. Trusting
 * a single call silently caps the gallery at 1000 files, which is the bug this
 * replaces.
 */
export async function listAll(bucket) {
  const objects = [];
  let cursor;

  for (;;) {
    const page = await bucket.list({ limit: R2_LIST_MAX, cursor });
    objects.push(...page.objects);

    if (!page.truncated || !page.cursor) break;

    // Defend against a cursor that never advances, which would spin forever.
    if (page.cursor === cursor) break;
    cursor = page.cursor;
  }

  return objects;
}

export async function handleManifest(bucket) {
  try {
    const objects = await listAll(bucket);

    const items = objects
      .filter((obj) => !isThumbKey(obj.key))
      .map((obj) => ({
        k: obj.key,
        s: obj.size,
        u: obj.uploaded.getTime(),
        t: classify(obj.key)
      }));

    items.sort((a, b) => b.u - a.u);

    return json({ items }, 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Never cache: a stale manifest would resurrect deleted files.
      'Cache-Control': 'no-store'
    }
  });
}
