/**
 * GET /<key>
 *
 * Serves an original object straight from R2.
 */

const IMMUTABLE = 'public, max-age=31536000, immutable';

export async function handleFile(bucket, key, request) {
  try {
    const object = await bucket.get(key);
    if (!object) return new Response('File not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', IMMUTABLE);
    headers.set('ETag', object.httpEtag);

    // HEAD must not carry a body, but should carry identical headers.
    if (request.method === 'HEAD') {
      headers.set('Content-Length', String(object.size));
      return new Response(null, { headers });
    }

    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(`Error retrieving file: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
