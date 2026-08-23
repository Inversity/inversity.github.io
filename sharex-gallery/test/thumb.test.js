import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { handleThumb } from '../src/handlers/thumb.js';
import { thumbKey } from '../src/lib/keys.js';

/**
 * Stands in for the Images binding. Real transformation is exercised against
 * the live binding in wrangler dev; here the point is the caching behaviour
 * around it, which is what the R2 write actually changes.
 */
function stubImages(output = 'WEBPBYTES') {
  const calls = [];
  return {
    calls,
    input(stream) {
      calls.push({ stage: 'input', stream });
      const chain = {
        transform(opts) {
          calls.push({ stage: 'transform', opts });
          return chain;
        },
        output(opts) {
          calls.push({ stage: 'output', opts });
          return Promise.resolve({
            response: () => new Response(output, {
              headers: { 'Content-Type': 'image/webp' }
            })
          });
        }
      };
      return chain;
    }
  };
}

async function clearBucket() {
  const listed = await env.BUCKET.list();
  if (listed.objects.length) {
    await env.BUCKET.delete(listed.objects.map((o) => o.key));
  }
}

describe('handleThumb', () => {
  beforeEach(clearBucket);

  it('transforms on a cache miss and writes the result back to R2', async () => {
    await env.BUCKET.put('shot.png', 'ORIGINALBYTES');
    const images = stubImages();
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: images }, 'shot.png', ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Thumb')).toBe('miss');
    expect(await res.text()).toBe('WEBPBYTES');

    const stored = await env.BUCKET.get(thumbKey('shot.png'));
    expect(stored).not.toBeNull();
    expect(await stored.text()).toBe('WEBPBYTES');
  });

  it('requests the configured width and format', async () => {
    await env.BUCKET.put('shot.png', 'ORIGINALBYTES');
    const images = stubImages();
    const ctx = createExecutionContext();

    await handleThumb({ BUCKET: env.BUCKET, IMAGES: images }, 'shot.png', ctx);
    await waitOnExecutionContext(ctx);

    const transform = images.calls.find((c) => c.stage === 'transform');
    const output = images.calls.find((c) => c.stage === 'output');

    expect(transform.opts).toEqual({ width: 480 });
    expect(output.opts).toEqual({ format: 'image/webp' });
  });

  it('serves the cached thumbnail without transforming again', async () => {
    await env.BUCKET.put('shot.png', 'ORIGINALBYTES');
    await env.BUCKET.put(thumbKey('shot.png'), 'CACHED');
    const images = stubImages();
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: images }, 'shot.png', ctx);
    await waitOnExecutionContext(ctx);

    expect(res.headers.get('X-Thumb')).toBe('hit');
    expect(await res.text()).toBe('CACHED');
    expect(images.calls).toHaveLength(0);
  });

  it('caches thumbnails immutably', async () => {
    await env.BUCKET.put('shot.png', 'x');
    await env.BUCKET.put(thumbKey('shot.png'), 'CACHED');
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: stubImages() }, 'shot.png', ctx);

    expect(res.headers.get('Cache-Control')).toContain('immutable');
  });

  it('redirects rather than transforming a non-image', async () => {
    await env.BUCKET.put('clip.mp4', 'x');
    const images = stubImages();
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: images }, 'clip.mp4', ctx);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/clip.mp4');
    expect(images.calls).toHaveLength(0);
  });

  it('redirects for svg, which is not worth rasterising', async () => {
    await env.BUCKET.put('logo.svg', '<svg/>');
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: stubImages() }, 'logo.svg', ctx);

    expect(res.status).toBe(302);
  });

  it('404s when the source does not exist', async () => {
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: stubImages() }, 'missing.png', ctx);

    expect(res.status).toBe(404);
  });

  it('falls back to the original when the transform throws', async () => {
    await env.BUCKET.put('shot.png', 'x');
    const exploding = {
      input() {
        return {
          transform() { return this; },
          output() { throw new Error('decode failed'); }
        };
      }
    };
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: exploding }, 'shot.png', ctx);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/shot.png');
  });

  it('percent-encodes the fallback location', async () => {
    await env.BUCKET.put('my shot.mp4', 'x');
    const ctx = createExecutionContext();

    const res = await handleThumb({ BUCKET: env.BUCKET, IMAGES: stubImages() }, 'my shot.mp4', ctx);

    expect(res.headers.get('Location')).toBe('/my%20shot.mp4');
  });
});
