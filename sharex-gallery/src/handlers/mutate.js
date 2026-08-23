/**
 * DELETE /<key>   remove an object
 * PATCH  /<key>   rename an object
 *
 * Both keep the thumbnail namespace consistent with the originals. A stale
 * thumbnail outliving its source would otherwise be unreachable garbage.
 */

import { thumbKey, sanitizeFilename, isReservedKey } from '../lib/keys.js';

export async function handleDelete(bucket, key) {
  try {
    // R2 accepts up to 1000 keys per call, so the object and its thumbnail go
    // in a single round trip. Deleting a key that does not exist is not an error.
    await bucket.delete([key, thumbKey(key)]);
    return json({ success: true, message: 'File deleted' }, 200);
  } catch (error) {
    return json({ success: false, message: error.message }, 500);
  }
}

export async function handleRename(bucket, oldKey, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body' }, 400);
  }

  const newKey = sanitizeFilename(body?.newName, oldKey);
  if (!newKey) {
    return json({ success: false, message: 'Invalid filename' }, 400);
  }

  if (newKey === oldKey) {
    return json({ success: true, message: 'Unchanged', newKey }, 200);
  }

  if (isReservedKey(newKey)) {
    return json({ success: false, message: 'That name is reserved' }, 400);
  }

  try {
    const existing = await bucket.head(newKey);
    if (existing) {
      return json(
        { success: false, message: `A file named "${newKey}" already exists` },
        409
      );
    }

    const original = await bucket.get(oldKey);
    if (!original) {
      return json({ success: false, message: 'Original file not found' }, 404);
    }

    await bucket.put(newKey, original.body, {
      httpMetadata: original.httpMetadata,
      customMetadata: original.customMetadata
    });

    // Drop the old object and its now-orphaned thumbnail. The new key's
    // thumbnail regenerates on next view, which is cheaper than copying it.
    await bucket.delete([oldKey, thumbKey(oldKey)]);

    return json({ success: true, message: 'File renamed', newKey }, 200);
  } catch (error) {
    return json({ success: false, message: error.message }, 500);
  }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
