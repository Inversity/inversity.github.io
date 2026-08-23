/**
 * File type classification by extension.
 */

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'
]);

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'mov', 'avi', 'webm', 'mkv'
]);

// SVG is already small and vector; rasterizing it to a thumbnail gains nothing.
const NOT_WORTH_THUMBNAILING = new Set(['svg']);

/**
 * Lowercased extension without the dot, or '' when there is none.
 */
export function extensionOf(key) {
  const base = key.slice(key.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/**
 * 'image' | 'video' | 'file'
 */
export function classify(key) {
  const ext = extensionOf(key);
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'file';
}

/**
 * Whether this key should be routed through the thumbnail pipeline.
 */
export function isThumbnailable(key) {
  const ext = extensionOf(key);
  return IMAGE_EXTENSIONS.has(ext) && !NOT_WORTH_THUMBNAILING.has(ext);
}
