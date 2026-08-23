import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { handleManifest, listAll } from '../src/handlers/manifest.js';
import { THUMB_PREFIX } from '../src/lib/keys.js';

/**
 * A bucket stub that pages exactly the way R2 does: at most `pageSize` objects
 * per call, with `truncated` and an opaque cursor. This exercises the cursor
 * loop without writing thousands of real objects.
 */
function pagingBucket(keys, pageSize = 1000) {
  const objects = keys.map((k, i) => ({
    key: k,
    size: 100 + i,
    uploaded: new Date(1700000000000 + i * 1000)
  }));

  return {
    calls: 0,
    async list({ cursor }) {
      this.calls++;
      const start = cursor ? Number(cursor) : 0;
      const slice = objects.slice(start, start + pageSize);
      const end = start + slice.length;
      const truncated = end < objects.length;
      return {
        objects: slice,
        truncated,
        cursor: truncated ? String(end) : undefined
      };
    }
  };
}

describe('listAll', () => {
  it('returns every object across multiple pages', async () => {
    const keys = Array.from({ length: 2500 }, (_, i) => `file-${i}.png`);
    const bucket = pagingBucket(keys);

    const objects = await listAll(bucket);

    expect(objects).toHaveLength(2500);
    expect(bucket.calls).toBe(3);
  });

  it('makes a single call when the bucket fits in one page', async () => {
    const bucket = pagingBucket(['a.png', 'b.png']);
    const objects = await listAll(bucket);

    expect(objects).toHaveLength(2);
    expect(bucket.calls).toBe(1);
  });

  it('handles an empty bucket', async () => {
    const bucket = pagingBucket([]);
    expect(await listAll(bucket)).toHaveLength(0);
  });

  it('stops instead of spinning when a cursor never advances', async () => {
    let calls = 0;
    const stuck = {
      async list() {
        calls++;
        return { objects: [{ key: 'a.png', size: 1, uploaded: new Date() }], truncated: true, cursor: 'same' };
      }
    };

    const objects = await listAll(stuck);

    // First call returns cursor 'same'; second call returns it again and the
    // loop breaks rather than hanging the request.
    expect(calls).toBe(2);
    expect(objects.length).toBeGreaterThan(0);
  });
});

describe('handleManifest', () => {
  beforeEach(async () => {
    const existing = await env.BUCKET.list();
    if (existing.objects.length) {
      await env.BUCKET.delete(existing.objects.map((o) => o.key));
    }
  });

  it('returns items newest first', async () => {
    await env.BUCKET.put('old.png', 'a');
    await new Promise((r) => setTimeout(r, 5));
    await env.BUCKET.put('new.png', 'b');

    const res = await handleManifest(env.BUCKET);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items.map((i) => i.k)).toEqual(['new.png', 'old.png']);
  });

  it('excludes the thumbnail namespace', async () => {
    await env.BUCKET.put('shot.png', 'a');
    await env.BUCKET.put(`${THUMB_PREFIX}shot.png.webp`, 'thumb');

    const body = await (await handleManifest(env.BUCKET)).json();

    expect(body.items.map((i) => i.k)).toEqual(['shot.png']);
  });

  it('tags each item with its type', async () => {
    await env.BUCKET.put('a.png', 'x');
    await env.BUCKET.put('b.mp4', 'x');
    await env.BUCKET.put('c.pdf', 'x');

    const body = await (await handleManifest(env.BUCKET)).json();
    const types = {};
    body.items.forEach((i) => { types[i.k] = i.t; });

    expect(types).toEqual({ 'a.png': 'image', 'b.mp4': 'video', 'c.pdf': 'file' });
  });

  it('emits size and upload time', async () => {
    await env.BUCKET.put('a.png', 'hello');

    const body = await (await handleManifest(env.BUCKET)).json();

    expect(body.items[0].s).toBe(5);
    expect(typeof body.items[0].u).toBe('number');
  });

  it('never caches, so a delete cannot be resurrected', async () => {
    const res = await handleManifest(env.BUCKET);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('reports a listing failure as a 500 rather than throwing', async () => {
    const broken = { async list() { throw new Error('R2 unavailable'); } };

    const res = await handleManifest(broken);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('R2 unavailable');
  });
});
