/**
 * The gallery document.
 *
 * Entirely static: no bucket data is interpolated here. Everything the user
 * sees is rendered client-side from the manifest, which means this response
 * never has to escape anything.
 */

import styles from './styles.css';
import client from './app.client.js';

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>ShareX Gallery</title>
<style>__STYLES__</style>
</head>
<body>
<div class="container">
  <header>
    <h1>ShareX Gallery</h1>
    <p class="subtitle">sharex.inversity.dev</p>
  </header>

  <div class="toolbar">
    <div class="chips" id="chips" role="group" aria-label="Filter by type">
      <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span class="count">0</span></button>
      <button type="button" class="chip" data-filter="image" aria-pressed="false">Images <span class="count">0</span></button>
      <button type="button" class="chip" data-filter="video" aria-pressed="false">Videos <span class="count">0</span></button>
      <button type="button" class="chip" data-filter="file" aria-pressed="false">Files <span class="count">0</span></button>
    </div>

    <span class="spacer"></span>

    <label class="field">
      <span class="sr-only">Search filenames</span>
      <input type="search" id="search" placeholder="Search filenames  ( / )" autocomplete="off" spellcheck="false">
    </label>

    <label class="field" for="pageSize">Show
      <select id="pageSize">
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="200">200</option>
      </select>
    </label>

    <label class="field" for="sort">Sort
      <select id="sort">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name">Name</option>
        <option value="largest">Largest</option>
      </select>
    </label>
  </div>

  <div class="grid" id="grid" aria-busy="true"></div>
  <div class="state" id="state" hidden></div>

  <nav class="pager" id="pager" aria-label="Pagination" hidden>
    <button type="button" id="prev">&larr; Prev</button>
    <span class="position">
      <span id="pageLabel">Page 1 of 1</span><br>
      <span id="position">0 of 0</span>
    </span>
    <button type="button" id="next">Next &rarr;</button>
  </nav>

  <footer>
    <p>Powered by <a href="https://workers.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Workers</a> + <a href="https://www.cloudflare.com/products/r2/" target="_blank" rel="noopener">R2</a></p>
    <p><a href="https://inversity.dev/">inversity.dev</a></p>
  </footer>
</div>

<div class="overlay" id="lightbox" role="dialog" aria-modal="true" aria-label="Media viewer">
  <button type="button" class="close-x" id="closeX" aria-label="Close">&#10005;</button>
  <button type="button" class="nav-arrow nav-prev" id="navPrev" aria-label="Previous">&lsaquo;</button>
  <div class="lightbox-stage" id="stage"></div>
  <button type="button" class="nav-arrow nav-next" id="navNext" aria-label="Next">&rsaquo;</button>
  <div class="lightbox-bar">
    <div>
      <p class="name" id="lightboxName"></p>
      <p class="meta" id="lightboxMeta"></p>
    </div>
    <div class="actions" id="lightboxActions"></div>
  </div>
</div>

<div class="overlay" id="renameModal" role="dialog" aria-modal="true" aria-labelledby="renameTitle">
  <div class="modal">
    <h3 id="renameTitle">Rename file</h3>
    <label>Current name</label>
    <div class="current" id="renameCurrent"></div>
    <label for="renameInput">New name</label>
    <input type="text" id="renameInput" autocomplete="off" spellcheck="false">
    <p class="hint">Letters, numbers, hyphens and underscores. The extension is kept.</p>
    <p class="modal-error" id="renameError" role="alert"></p>
    <div class="modal-buttons">
      <button type="button" class="btn-cancel" id="renameCancel">Cancel</button>
      <button type="button" class="btn-confirm" id="renameConfirm">Rename</button>
    </div>
  </div>
</div>

<script>__CLIENT__</script>
</body>
</html>`;

export function renderShell() {
  const body = HTML
    .replace('__STYLES__', () => styles)
    .replace('__CLIENT__', () => client);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // The shell is static, but it is cheap and avoids serving a stale
      // client after a deploy.
      'Cache-Control': 'no-cache'
    }
  });
}
