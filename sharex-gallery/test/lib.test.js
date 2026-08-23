import { describe, it, expect } from 'vitest';
import { classify, extensionOf, isThumbnailable } from '../src/lib/classify.js';
import {
  thumbKey,
  isThumbKey,
  isReservedKey,
  sanitizeFilename,
  THUMB_PREFIX
} from '../src/lib/keys.js';

describe('extensionOf', () => {
  it('lowercases the extension', () => {
    expect(extensionOf('Shot.PNG')).toBe('png');
  });

  it('returns empty string when there is no extension', () => {
    expect(extensionOf('README')).toBe('');
  });

  it('ignores dots in directories', () => {
    expect(extensionOf('my.folder/README')).toBe('');
  });

  it('does not treat a dotfile as an extension', () => {
    expect(extensionOf('.gitignore')).toBe('');
  });

  it('returns empty string for a trailing dot', () => {
    expect(extensionOf('weird.')).toBe('');
  });

  it('takes only the last extension', () => {
    expect(extensionOf('archive.tar.gz')).toBe('gz');
  });
});

describe('classify', () => {
  it('recognises images', () => {
    ['a.png', 'a.JPG', 'a.jpeg', 'a.gif', 'a.webp', 'a.bmp', 'a.svg', 'a.avif']
      .forEach((k) => expect(classify(k)).toBe('image'));
  });

  it('recognises videos', () => {
    ['a.mp4', 'a.MOV', 'a.avi', 'a.webm', 'a.mkv']
      .forEach((k) => expect(classify(k)).toBe('video'));
  });

  it('falls back to file', () => {
    ['a.pdf', 'a.zip', 'notes', 'a.txt']
      .forEach((k) => expect(classify(k)).toBe('file'));
  });
});

describe('isThumbnailable', () => {
  it('accepts raster images', () => {
    expect(isThumbnailable('a.png')).toBe(true);
  });

  it('rejects svg, which gains nothing from rasterising', () => {
    expect(isThumbnailable('a.svg')).toBe(false);
  });

  it('rejects video and other files', () => {
    expect(isThumbnailable('a.mp4')).toBe(false);
    expect(isThumbnailable('a.pdf')).toBe(false);
  });
});

describe('thumbKey', () => {
  it('namespaces under the reserved prefix', () => {
    expect(thumbKey('shot.png')).toBe(`${THUMB_PREFIX}shot.png.webp`);
  });

  it('keeps the original extension so different sources cannot collide', () => {
    expect(thumbKey('a.png')).not.toBe(thumbKey('a.jpg'));
  });

  it('round-trips through isThumbKey', () => {
    expect(isThumbKey(thumbKey('shot.png'))).toBe(true);
    expect(isThumbKey('shot.png')).toBe(false);
  });
});

describe('isReservedKey', () => {
  it('reserves worker routes', () => {
    expect(isReservedKey('gallery')).toBe(true);
    expect(isReservedKey('api/list')).toBe(true);
    expect(isReservedKey('_thumb/x.png')).toBe(true);
  });

  it('reserves the thumbnail namespace', () => {
    expect(isReservedKey('_thumbs/a.png.webp')).toBe(true);
  });

  it('allows ordinary uploads', () => {
    expect(isReservedKey('screenshot-2026.png')).toBe(false);
  });

  it('does not reserve a name that merely starts with a reserved word', () => {
    expect(isReservedKey('gallery-notes.png')).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('keeps the original extension', () => {
    expect(sanitizeFilename('holiday', 'IMG_1.png')).toBe('holiday.png');
  });

  it('replaces the typed extension with the original', () => {
    expect(sanitizeFilename('holiday.exe', 'IMG_1.png')).toBe('holiday.png');
  });

  it('replaces unsafe characters', () => {
    expect(sanitizeFilename('my file!', 'a.png')).toBe('my_file_.png');
  });

  it('strips directory traversal', () => {
    expect(sanitizeFilename('../../etc/passwd', 'a.png')).toBe('passwd.png');
    expect(sanitizeFilename('..\\..\\win', 'a.png')).toBe('win.png');
  });

  it('rejects names that sanitize to nothing', () => {
    expect(sanitizeFilename('...', 'a.png')).toBeNull();
    expect(sanitizeFilename('   ', 'a.png')).toBeNull();
  });

  it('rejects non-strings', () => {
    expect(sanitizeFilename(undefined, 'a.png')).toBeNull();
    expect(sanitizeFilename(42, 'a.png')).toBeNull();
  });

  it('rejects names that would shadow a worker route', () => {
    expect(sanitizeFilename('gallery', 'gallery')).toBeNull();
  });

  it('handles a source with no extension', () => {
    expect(sanitizeFilename('notes', 'README')).toBe('notes');
  });
});
