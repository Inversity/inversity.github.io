/**
 * ShareX Gallery Worker
 *
 * Routes only. Every branch delegates to a handler.
 */

import { handleManifest } from './handlers/manifest.js';
import { handleThumb } from './handlers/thumb.js';
import { handleFile } from './handlers/file.js';
import { handleDelete, handleRename } from './handlers/mutate.js';
import { renderShell } from './ui/shell.js';

const THUMB_ROUTE = '/_thumb/';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;

    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(`${url.origin}/gallery`, 302);
    }

    if (url.pathname === '/gallery') {
      return methodGuard(method, ['GET', 'HEAD']) ?? renderShell();
    }

    if (url.pathname === '/api/list') {
      return methodGuard(method, ['GET']) ?? handleManifest(env.BUCKET);
    }

    if (url.pathname.startsWith(THUMB_ROUTE)) {
      const key = decodeKey(url.pathname.slice(THUMB_ROUTE.length));
      if (key === null) return new Response('Bad request', { status: 400 });
      return methodGuard(method, ['GET', 'HEAD']) ?? handleThumb(env, key, ctx);
    }

    const key = decodeKey(url.pathname.slice(1));
    if (key === null) return new Response('Bad request', { status: 400 });
    if (key === '') return new Response('Not found', { status: 404 });

    if (method === 'DELETE') return handleDelete(env.BUCKET, key);
    if (method === 'PATCH') return handleRename(env.BUCKET, key, request);

    return methodGuard(method, ['GET', 'HEAD'])
      ?? handleFile(env.BUCKET, key, request);
  }
};

/**
 * Returns a 405 when the method is not allowed, otherwise null so the caller
 * can fall through with `??`.
 */
function methodGuard(method, allowed) {
  if (allowed.includes(method)) return null;
  return new Response('Method not allowed', {
    status: 405,
    headers: { Allow: allowed.join(', ') }
  });
}

/**
 * Percent-decodes a path segment into an R2 key.
 * Returns null for malformed encoding, which decodeURIComponent throws on.
 */
function decodeKey(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
