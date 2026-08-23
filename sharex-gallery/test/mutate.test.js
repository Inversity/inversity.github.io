import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { handleDelete, handleRename } from '../src/handlers/mutate.js';
import { thumbKey } from '../src/lib/keys.js';

async function clearBucket() {
  const listed = await env.BUCKET.list();
  if (listed.objects.length) {
    await env.BUCKET.delete(listed.objects.map((o) => o.key));
  }
}

function patch(newName) {
  return new Request('https://example.com/x', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newName })
  });
}

describe('handleDelete', () => {
  beforeEach(clearBucket);

  it('removes the object and its thumbnail together', async () => {
    await env.BUCKET.put('shot.png', 'x');
    await env.BUCKET.put(thumbKey('shot.png'), 'thumb');

    const res = await handleDelete(env.BUCKET, 'shot.png');

    expect((await res.json()).success).toBe(true);
    expect(await env.BUCKET.head('shot.png')).toBeNull();
    expect(await env.BUCKET.head(thumbKey('shot.png'))).toBeNull();
  });

  it('succeeds when there is no thumbnail to remove', async () => {
    await env.BUCKET.put('shot.png', 'x');

    const res = await handleDelete(env.BUCKET, 'shot.png');

    expect(res.status).toBe(200);
    expect(await env.BUCKET.head('shot.png')).toBeNull();
  });

  it('reports a failure as a 500 rather than throwing', async () => {
    const broken = { async delete() { throw new Error('R2 down'); } };

    const res = await handleDelete(broken, 'shot.png');

    expect(res.status).toBe(500);
    expect((await res.json()).success).toBe(false);
  });
});

describe('handleRename', () => {
  beforeEach(clearBucket);

  it('moves the object to the new key', async () => {
    await env.BUCKET.put('IMG_1.png', 'content');

    const res = await handleRename(env.BUCKET, 'IMG_1.png', patch('holiday'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.newKey).toBe('holiday.png');
    expect(await env.BUCKET.head('IMG_1.png')).toBeNull();
    expect(await (await env.BUCKET.get('holiday.png')).text()).toBe('content');
  });

  it('removes the stale thumbnail so it regenerates under the new key', async () => {
    await env.BUCKET.put('IMG_1.png', 'content');
    await env.BUCKET.put(thumbKey('IMG_1.png'), 'thumb');

    await handleRename(env.BUCKET, 'IMG_1.png', patch('holiday'));

    expect(await env.BUCKET.head(thumbKey('IMG_1.png'))).toBeNull();
  });

  it('refuses to overwrite an existing file', async () => {
    await env.BUCKET.put('a.png', 'first');
    await env.BUCKET.put('b.png', 'second');

    const res = await handleRename(env.BUCKET, 'a.png', patch('b'));

    expect(res.status).toBe(409);
    expect(await (await env.BUCKET.get('b.png')).text()).toBe('second');
    expect(await env.BUCKET.head('a.png')).not.toBeNull();
  });

  it('rejects a filename that sanitizes to nothing', async () => {
    await env.BUCKET.put('a.png', 'x');

    const res = await handleRename(env.BUCKET, 'a.png', patch('...'));

    expect(res.status).toBe(400);
    expect(await env.BUCKET.head('a.png')).not.toBeNull();
  });

  it('rejects a malformed body', async () => {
    await env.BUCKET.put('a.png', 'x');
    const bad = new Request('https://example.com/x', { method: 'PATCH', body: 'not json' });

    const res = await handleRename(env.BUCKET, 'a.png', bad);

    expect(res.status).toBe(400);
  });

  it('treats an unchanged name as a no-op', async () => {
    await env.BUCKET.put('a.png', 'x');

    const res = await handleRename(env.BUCKET, 'a.png', patch('a'));

    expect(res.status).toBe(200);
    expect(await env.BUCKET.head('a.png')).not.toBeNull();
  });

  it('404s when the source is gone', async () => {
    const res = await handleRename(env.BUCKET, 'ghost.png', patch('new'));

    expect(res.status).toBe(404);
  });

  it('cannot be used to escape into the thumbnail namespace', async () => {
    await env.BUCKET.put('a.png', 'x');

    const res = await handleRename(env.BUCKET, 'a.png', patch('_thumbs/evil'));
    const body = await res.json();

    // The slash is stripped as a directory component, leaving a safe flat name.
    expect(body.newKey).toBe('evil.png');
  });
});
