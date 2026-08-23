/**
 * Exercises the real Images binding rather than a stub.
 *
 * The other thumbnail tests cover caching behaviour with a fake transformer.
 * These cover the part a fake cannot: that the binding actually produces a
 * smaller WebP from real PNG bytes, and that the cached copy is the transformed
 * one rather than the original.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { handleThumb } from '../src/handlers/thumb.js';
import { thumbKey } from '../src/lib/keys.js';
import { samplePngBytes, SAMPLE_PNG_WIDTH } from './fixtures/sample-png.js';

/** WebP files begin with "RIFF" .... "WEBP". */
function isWebp(bytes) {
  const tag = (o) => String.fromCharCode(...bytes.slice(o, o + 4));
  return tag(0) === 'RIFF' && tag(8) === 'WEBP';
}

async function clearBucket() {
  const listed = await env.BUCKET.list();
  if (listed.objects.length) {
    await env.BUCKET.delete(listed.objects.map((o) => o.key));
  }
}

describe('thumbnail generation against the real Images binding', () => {
  beforeEach(clearBucket);

  it('produces a genuine WebP smaller than the source', async () => {
    const source = samplePngBytes();
    await env.BUCKET.put('shot.png', source);
    const ctx = createExecutionContext();

    const res = await handleThumb(env, 'shot.png', ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Thumb')).toBe('miss');

    const out = new Uint8Array(await res.arrayBuffer());

    expect(isWebp(out)).toBe(true);
    expect(out.byteLength).toBeLessThan(source.byteLength);
  });

  it('reports the resized width through the binding info call', async () => {
    const source = samplePngBytes();
    await env.BUCKET.put('shot.png', source);
    const ctx = createExecutionContext();

    await handleThumb(env, 'shot.png', ctx);
    await waitOnExecutionContext(ctx);

    const stored = await env.BUCKET.get(thumbKey('shot.png'));
    const info = await env.IMAGES.info(stored.body);

    expect(info.width).toBe(480);
    expect(info.width).toBeLessThan(SAMPLE_PNG_WIDTH);
  });

  it('caches the transformed bytes, not the original', async () => {
    const source = samplePngBytes();
    await env.BUCKET.put('shot.png', source);
    const ctx = createExecutionContext();

    await handleThumb(env, 'shot.png', ctx);
    await waitOnExecutionContext(ctx);

    const stored = await env.BUCKET.get(thumbKey('shot.png'));
    const bytes = new Uint8Array(await stored.arrayBuffer());

    expect(isWebp(bytes)).toBe(true);
    expect(stored.httpMetadata.contentType).toBe('image/webp');
  });

  it('serves the second request from R2 with identical bytes', async () => {
    await env.BUCKET.put('shot.png', samplePngBytes());

    const ctx1 = createExecutionContext();
    const first = await handleThumb(env, 'shot.png', ctx1);
    const firstBytes = new Uint8Array(await first.arrayBuffer());
    await waitOnExecutionContext(ctx1);

    const ctx2 = createExecutionContext();
    const second = await handleThumb(env, 'shot.png', ctx2);
    const secondBytes = new Uint8Array(await second.arrayBuffer());
    await waitOnExecutionContext(ctx2);

    expect(second.headers.get('X-Thumb')).toBe('hit');
    expect(Array.from(secondBytes)).toEqual(Array.from(firstBytes));
  });
});
