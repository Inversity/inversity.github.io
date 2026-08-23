/**
 * Key derivation and path reservation.
 *
 * Thumbnails live alongside originals in the same bucket under a reserved
 * prefix. Anything under that prefix is invisible to the manifest and cannot be
 * addressed directly, so it can never appear in the gallery as an item.
 */

import { extensionOf } from './classify.js';

export const THUMB_PREFIX = '_thumbs/';

/** Worker routes that must never be shadowed by an object key. */
const RESERVED_PATHS = ['gallery', 'api', '_thumb'];

/**
 * Storage key for a source object's thumbnail.
 *
 * The original extension is kept in the name rather than replaced, so
 * `a.png` and `a.jpg` cannot collide on a single `a.webp`.
 */
export function thumbKey(key) {
  return `${THUMB_PREFIX}${key}.webp`;
}

/** Whether a key belongs to the reserved thumbnail namespace. */
export function isThumbKey(key) {
  return key.startsWith(THUMB_PREFIX);
}

/**
 * Whether a request path collides with a Worker route.
 * Takes a key (no leading slash).
 */
export function isReservedKey(key) {
  const head = key.split('/')[0];
  return RESERVED_PATHS.includes(head) || isThumbKey(key);
}

/**
 * Constrains a user-supplied filename to a safe key.
 *
 * Returns the sanitized name, or null when nothing usable survives. The
 * original extension always wins, so a rename cannot change a file's type or
 * smuggle in a second extension.
 */
export function sanitizeFilename(rawName, originalKey) {
  if (typeof rawName !== 'string') return null;

  const originalExt = extensionOf(originalKey);

  // Strip any directory components before sanitizing, so '../' cannot survive.
  let name = rawName.trim().split(/[\\/]/).pop() || '';

  // Drop whatever extension was typed; the original is reapplied below.
  name = name.replace(/\.[^.]+$/, '');

  name = name.replace(/[^a-zA-Z0-9\-_.]/g, '_');

  // A name of only dots would produce a hidden or malformed key.
  if (name.replace(/\./g, '').length === 0) return null;

  const key = originalExt ? `${name}.${originalExt}` : name;

  return isReservedKey(key) ? null : key;
}
