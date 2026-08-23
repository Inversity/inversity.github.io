/**
 * GET /_thumb/<key>
 *
 * Serves a small WebP preview. The first request for a key transforms the
 * original and writes the result back into R2; every later request is a plain
 * R2 read with no transformation.
 *
 * This matters because the Images binding does not cache. Each uncached call
 * fully decodes and re-encodes the source. Persisting the output turns a
 * per-request cost into a once-per-file cost.
 */

import { thumbKey } from '../lib/keys.js';
import { isThumbnailable } from '../lib/classify.js';

const THUMB_WIDTH = 480;
const THUMB_FORMAT = 'image/webp';

/** Hard input limit of the Images binding. */
const MAX_TRANSFORM_BYTES = 20 * 1024 * 1024;

const IMMUTABLE = 'public, max-age=31536000, immutable';

export async function handleThumb(env, key, ctx) {
  if (!isThumbnailable(key)) return redirectToOriginal(key);

  const cacheKey = thumbKey(key);

  const cached = await env.BUCKET.get(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        'Content-Type': THUMB_FORMAT,
        'Cache-Control': IMMUTABLE,
        'X-Thumb': 'hit'
      }
    });
  }

  const source = await env.BUCKET.get(key);
  if (!source) return new Response('Not found', { status: 404 });

  // Oversize sources would throw inside the binding. Degrade to the original
  // instead: the tile still renders, it just costs more bytes.
  if (source.size > MAX_TRANSFORM_BYTES) return redirectToOriginal(key);

  try {
    const result = await env.IMAGES.input(source.body)
      .transform({ width: THUMB_WIDTH })
      .output({ format: THUMB_FORMAT });

    // Buffered rather than streamed because the bytes are needed twice: once
    // for this response, once for the cache write. Thumbnails are tens of KB.
    const bytes = await result.response().arrayBuffer();

    ctx.waitUntil(
      env.BUCKET.put(cacheKey, bytes, {
        httpMetadata: { contentType: THUMB_FORMAT, cacheControl: IMMUTABLE }
      })
    );

    return new Response(bytes, {
      headers: {
        'Content-Type': THUMB_FORMAT,
        'Cache-Control': IMMUTABLE,
        'X-Thumb': 'miss'
      }
    });
  } catch (error) {
    console.error(`Thumbnail failed for ${key}: ${error.message}`);
    return redirectToOriginal(key);
  }
}

/**
 * Falls back to the full-size object. Cached briefly rather than permanently,
 * so a transient transform failure does not pin a file to its original forever.
 */
function redirectToOriginal(key) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/${encodeURIComponent(key)}`,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
