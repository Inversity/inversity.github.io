import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';

async function clearBucket() {
  const listed = await env.BUCKET.list();
  if (listed.objects.length) {
    await env.BUCKET.delete(listed.objects.map((o) => o.key));
  }
}

describe('routing', () => {
  beforeEach(clearBucket);

  it('redirects the root to the gallery', async () => {
    const res = await SELF.fetch('https://example.com/', { redirect: 'manual' });

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://example.com/gallery');
  });

  it('serves the gallery shell', async () => {
    const res = await SELF.fetch('https://example.com/gallery');
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(html).toContain('ShareX Gallery');
  });

  it('inlines the stylesheet and the client script', async () => {
    const html = await (await SELF.fetch('https://example.com/gallery')).text();

    // Proves the Text module rules resolved. If either rule failed, the
    // placeholder would survive or the import would have thrown at build time.
    expect(html).not.toContain('__STYLES__');
    expect(html).not.toContain('__CLIENT__');
    expect(html).toContain('grid-template-columns');
    expect(html).toContain('sharex-gallery-prefs');
  });

  it('serves the manifest as JSON', async () => {
    await env.BUCKET.put('a.png', 'x');

    const res = await SELF.fetch('https://example.com/api/list');
    const body = await res.json();

    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(body.items).toHaveLength(1);
  });

  it('serves an original file', async () => {
    await env.BUCKET.put('a.txt', 'hello');

    const res = await SELF.fetch('https://example.com/a.txt');

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('hello');
  });

  it('decodes percent-encoded keys', async () => {
    await env.BUCKET.put('my shot.png', 'bytes');

    const res = await SELF.fetch('https://example.com/my%20shot.png');

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('bytes');
  });

  it('404s an unknown file', async () => {
    const res = await SELF.fetch('https://example.com/nope.png');
    expect(res.status).toBe(404);
  });

  it('answers HEAD without a body', async () => {
    await env.BUCKET.put('a.txt', 'hello');

    const res = await SELF.fetch('https://example.com/a.txt', { method: 'HEAD' });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
  });

  it('rejects a disallowed method on the manifest', async () => {
    const res = await SELF.fetch('https://example.com/api/list', { method: 'POST' });

    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET');
  });

  it('rejects a malformed percent-encoded path', async () => {
    const res = await SELF.fetch('https://example.com/%E0%A4%A');

    expect(res.status).toBe(400);
  });

  it('routes DELETE to the mutate handler', async () => {
    await env.BUCKET.put('a.png', 'x');

    const res = await SELF.fetch('https://example.com/a.png', { method: 'DELETE' });

    expect((await res.json()).success).toBe(true);
    expect(await env.BUCKET.head('a.png')).toBeNull();
  });

  it('routes PATCH to the rename handler', async () => {
    await env.BUCKET.put('a.png', 'x');

    const res = await SELF.fetch('https://example.com/a.png', {
      method: 'PATCH',
      body: JSON.stringify({ newName: 'renamed' })
    });

    expect((await res.json()).newKey).toBe('renamed.png');
  });
});
