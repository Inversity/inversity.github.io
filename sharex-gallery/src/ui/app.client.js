/* ShareX Gallery client.
 *
 * The whole manifest is fetched once. Filtering, searching, sorting and
 * pagination all run against it in memory, so nothing but media costs a
 * request after load.
 *
 * Tiles are built with DOM APIs rather than innerHTML. Filenames are attacker-
 * adjacent data and this makes markup injection structurally impossible rather
 * than a matter of remembering to escape.
 */
(function () {
  'use strict';

  var PAGE_SIZES = [20, 50, 100, 200];
  var PREFS_KEY = 'sharex-gallery-prefs';

  var state = {
    items: [],
    view: [],
    filter: 'all',
    query: '',
    sort: 'newest',
    pageSize: 20,
    page: 1,
    lightboxIndex: -1,
    loading: true,
    error: null
  };

  var el = {};
  var lastFocused = null;
  var searchTimer = null;

  /* ---------- utilities ---------- */

  function encodeKey(key) {
    return key.split('/').map(encodeURIComponent).join('/');
  }

  function originalUrl(key) {
    return '/' + encodeKey(key);
  }

  function thumbUrl(key) {
    return '/_thumb/' + encodeKey(key);
  }

  function absoluteUrl(key) {
    return location.origin + originalUrl(key);
  }

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)) + ' ' + units[i];
  }

  function formatDate(ms) {
    var d = new Date(ms);
    var now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return 'Today ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    var yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    var opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString([], opts);
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      var p = JSON.parse(raw);
      if (PAGE_SIZES.indexOf(p.pageSize) !== -1) state.pageSize = p.pageSize;
      if (typeof p.sort === 'string') state.sort = p.sort;
      if (typeof p.filter === 'string') state.filter = p.filter;
    } catch (err) {
      /* private mode, blocked storage, corrupt value: defaults are fine */
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ pageSize: state.pageSize, sort: state.sort, filter: state.filter })
      );
    } catch (err) {
      /* not worth surfacing */
    }
  }

  /* ---------- data ---------- */

  function computeView() {
    var q = state.query.trim().toLowerCase();

    state.view = state.items.filter(function (item) {
      if (state.filter !== 'all' && item.t !== state.filter) return false;
      if (q && item.k.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    var sorters = {
      newest: function (a, b) { return b.u - a.u; },
      oldest: function (a, b) { return a.u - b.u; },
      name: function (a, b) { return a.k.localeCompare(b.k); },
      largest: function (a, b) { return b.s - a.s; }
    };
    state.view.sort(sorters[state.sort] || sorters.newest);

    var pages = totalPages();
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
  }

  function totalPages() {
    return Math.max(1, Math.ceil(state.view.length / state.pageSize));
  }

  function pageSlice() {
    var start = (state.page - 1) * state.pageSize;
    return state.view.slice(start, start + state.pageSize);
  }

  function loadManifest() {
    state.loading = true;
    state.error = null;
    render();

    return fetch('/api/list', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('Server returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        state.items = data.items || [];
        state.loading = false;
        computeView();
        render();
      })
      .catch(function (err) {
        state.loading = false;
        state.error = err.message;
        render();
      });
  }

  /* ---------- rendering ---------- */

  function render() {
    renderChips();
    renderGrid();
    renderPager();
  }

  function renderChips() {
    var counts = { all: state.items.length, image: 0, video: 0, file: 0 };
    state.items.forEach(function (i) { counts[i.t] = (counts[i.t] || 0) + 1; });

    Array.prototype.forEach.call(el.chips.querySelectorAll('.chip'), function (chip) {
      var key = chip.dataset.filter;
      chip.setAttribute('aria-pressed', String(key === state.filter));
      var span = chip.querySelector('.count');
      if (span) span.textContent = counts[key] || 0;
    });
  }

  function renderGrid() {
    el.grid.textContent = '';
    el.state.hidden = true;

    if (state.loading) {
      el.grid.hidden = false;
      for (var i = 0; i < state.pageSize && i < 20; i++) {
        var sk = document.createElement('div');
        sk.className = 'skeleton';
        el.grid.appendChild(sk);
      }
      return;
    }

    if (state.error) {
      el.grid.hidden = true;
      showState('!', 'Could not load the gallery', state.error, 'Retry', loadManifest);
      return;
    }

    if (state.items.length === 0) {
      el.grid.hidden = true;
      showState('[ ]', 'No uploads yet', 'Send a screenshot with ShareX to get started.');
      return;
    }

    if (state.view.length === 0) {
      el.grid.hidden = true;
      showState('[ ]', 'Nothing matches', 'No files match the current filter or search.',
        'Clear filters', function () {
          state.query = '';
          state.filter = 'all';
          el.search.value = '';
          savePrefs();
          computeView();
          render();
        });
      return;
    }

    el.grid.hidden = false;
    var items = pageSlice();
    var offset = (state.page - 1) * state.pageSize;
    items.forEach(function (item, i) {
      el.grid.appendChild(buildTile(item, offset + i));
    });
  }

  function showState(glyph, title, detail, actionLabel, onAction) {
    el.state.textContent = '';
    el.state.hidden = false;

    var g = document.createElement('div');
    g.className = 'glyph';
    g.textContent = glyph;
    el.state.appendChild(g);

    var h = document.createElement('h2');
    h.textContent = title;
    el.state.appendChild(h);

    var p = document.createElement('p');
    p.textContent = detail;
    el.state.appendChild(p);

    if (actionLabel) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = actionLabel;
      btn.addEventListener('click', onAction);
      el.state.appendChild(btn);
    }
  }

  function buildTile(item, viewIndex) {
    var tile = document.createElement('figure');
    tile.className = 'tile';

    var link = document.createElement('a');
    link.className = 'tile-link';
    link.href = originalUrl(item.k);
    link.appendChild(buildPreview(item));

    // Plain left click opens the lightbox. Modified clicks and middle click
    // keep the browser's native new-tab behaviour, which is why this stays a
    // real anchor with a real href.
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openLightbox(viewIndex);
    });

    tile.appendChild(link);

    var caption = document.createElement('figcaption');
    caption.className = 'caption';

    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = item.k;
    name.title = item.k;
    caption.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatDate(item.u) + '  ·  ' + formatSize(item.s);
    caption.appendChild(meta);

    caption.appendChild(buildActions(item, tile));
    tile.appendChild(caption);

    return tile;
  }

  function buildPreview(item) {
    if (item.t === 'image') {
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = item.k;
      img.src = thumbUrl(item.k);
      img.addEventListener('error', function () {
        img.replaceWith(placeholder('[image]', item.k));
      });
      return img;
    }

    if (item.t === 'video') {
      // Deliberately not a <video> element: 100 of those fire 100 range
      // requests on load. Nothing is fetched until the lightbox opens.
      var wrap = document.createElement('div');
      wrap.className = 'placeholder';
      var badge = document.createElement('div');
      badge.className = 'play-badge';
      badge.textContent = '▶';
      wrap.appendChild(badge);
      return wrap;
    }

    return placeholder(iconFor(item.k), item.k);
  }

  function placeholder(glyph, label) {
    var wrap = document.createElement('div');
    wrap.className = 'placeholder';
    var g = document.createElement('div');
    g.className = 'glyph';
    g.textContent = glyph;
    wrap.appendChild(g);
    if (label) {
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = label;
      wrap.appendChild(sr);
    }
    return wrap;
  }

  function iconFor(key) {
    var ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    var icons = {
      pdf: '📄', doc: '📝', docx: '📝', txt: '📄',
      zip: '🗜', rar: '🗜', '7z': '🗜',
      mp3: '🎵', wav: '🎵',
      json: '📋', xml: '📋', csv: '📊',
      exe: '⚙', msi: '⚙'
    };
    return icons[ext] || '📎';
  }

  function buildActions(item, tile) {
    var actions = document.createElement('div');
    actions.className = 'actions';

    actions.appendChild(actionButton('Copy', 'copy', function (btn) {
      copyUrl(item, btn);
    }));

    actions.appendChild(actionButton('Rename', 'rename', function () {
      openRename(item);
    }));

    actions.appendChild(actionButton('Delete', 'delete', function (btn) {
      deleteItem(item, btn, tile);
    }));

    return actions;
  }

  function actionButton(label, cls, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.textContent = label;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onClick(btn);
    });
    return btn;
  }

  function renderPager() {
    var pages = totalPages();
    var showing = pageSlice().length;
    var start = showing ? (state.page - 1) * state.pageSize + 1 : 0;

    el.position.textContent = showing
      ? start + '–' + (start + showing - 1) + ' of ' + state.view.length
      : '0 of 0';
    el.pageLabel.textContent = 'Page ' + state.page + ' of ' + pages;

    el.prev.disabled = state.page <= 1;
    el.next.disabled = state.page >= pages;
    el.pager.hidden = state.loading || !!state.error || state.view.length === 0;
  }

  function goToPage(page) {
    var pages = totalPages();
    state.page = Math.min(Math.max(1, page), pages);
    render();
    el.grid.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* ---------- actions ---------- */

  function copyUrl(item, btn) {
    var url = absoluteUrl(item.k);
    var done = function () {
      var original = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('ok');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('ok');
      }, 1600);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url, done); });
    } else {
      fallbackCopy(url, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (err) {
      window.prompt('Copy this URL:', text);
    }
    document.body.removeChild(ta);
  }

  function deleteItem(item, btn, tile) {
    if (!window.confirm('Delete "' + item.k + '"?\nThis cannot be undone.')) return;

    btn.disabled = true;
    var original = btn.textContent;
    btn.textContent = '...';

    fetch(originalUrl(item.k), { method: 'DELETE' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success) throw new Error(result.message || 'Delete failed');
        removeItem(item.k);
        if (state.lightboxIndex >= 0) closeLightbox();
        computeView();
        render();
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = original;
        showTileError(tile, err.message);
      });
  }

  function removeItem(key) {
    state.items = state.items.filter(function (i) { return i.k !== key; });
  }

  function showTileError(tile, message) {
    if (!tile) { window.alert(message); return; }
    tile.classList.add('error');
    var existing = tile.querySelector('.tile-error');
    if (existing) existing.remove();
    var p = document.createElement('p');
    p.className = 'tile-error';
    p.textContent = message;
    tile.appendChild(p);
    setTimeout(function () {
      tile.classList.remove('error');
      p.remove();
    }, 5000);
  }

  /* ---------- rename modal ---------- */

  var renameTarget = null;

  function openRename(item) {
    renameTarget = item;
    lastFocused = document.activeElement;
    el.renameCurrent.textContent = item.k;
    var dot = item.k.lastIndexOf('.');
    el.renameInput.value = dot > 0 ? item.k.slice(0, dot) : item.k;
    el.renameError.textContent = '';
    el.renameConfirm.disabled = false;
    el.renameConfirm.textContent = 'Rename';
    el.renameModal.classList.add('active');
    el.renameInput.focus();
    el.renameInput.select();
  }

  function closeRename() {
    el.renameModal.classList.remove('active');
    renameTarget = null;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function performRename() {
    if (!renameTarget) return;
    var newName = el.renameInput.value.trim();
    if (!newName) {
      el.renameError.textContent = 'Enter a filename.';
      return;
    }

    var target = renameTarget;
    el.renameConfirm.disabled = true;
    el.renameConfirm.textContent = 'Renaming...';
    el.renameError.textContent = '';

    fetch(originalUrl(target.k), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName: newName })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success) throw new Error(result.message || 'Rename failed');
        var entry = state.items.filter(function (i) { return i.k === target.k; })[0];
        if (entry) entry.k = result.newKey;
        closeRename();
        computeView();
        render();
      })
      .catch(function (err) {
        el.renameConfirm.disabled = false;
        el.renameConfirm.textContent = 'Rename';
        el.renameError.textContent = err.message;
      });
  }

  /* ---------- lightbox ---------- */

  function openLightbox(viewIndex) {
    if (viewIndex < 0 || viewIndex >= state.view.length) return;
    if (state.lightboxIndex < 0) lastFocused = document.activeElement;

    state.lightboxIndex = viewIndex;
    var item = state.view[viewIndex];

    el.stage.textContent = '';
    if (item.t === 'video') {
      var video = document.createElement('video');
      video.src = originalUrl(item.k);
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      el.stage.appendChild(video);
    } else if (item.t === 'image') {
      var img = document.createElement('img');
      img.src = originalUrl(item.k);
      img.alt = item.k;
      el.stage.appendChild(img);
    } else {
      var link = document.createElement('a');
      link.href = originalUrl(item.k);
      link.target = '_blank';
      link.rel = 'noopener';
      link.appendChild(placeholder(iconFor(item.k), null));
      var label = document.createElement('p');
      label.textContent = 'Open ' + item.k;
      link.appendChild(label);
      el.stage.appendChild(link);
    }

    el.lightboxName.textContent = item.k;
    el.lightboxMeta.textContent = formatDate(item.u) + '  ·  ' + formatSize(item.s);

    el.lightboxActions.textContent = '';
    el.lightboxActions.appendChild(actionButton('Copy URL', 'copy', function (btn) {
      copyUrl(item, btn);
    }));
    el.lightboxActions.appendChild(actionButton('Rename', 'rename', function () {
      openRename(item);
    }));
    el.lightboxActions.appendChild(actionButton('Delete', 'delete', function (btn) {
      deleteItem(item, btn, null);
    }));

    el.navPrev.disabled = viewIndex <= 0;
    el.navNext.disabled = viewIndex >= state.view.length - 1;

    el.lightbox.classList.add('active');
    el.closeX.focus();

    // Keep the grid on the page the lightbox is browsing, so closing it leaves
    // you where you actually are rather than where you started.
    var page = Math.floor(viewIndex / state.pageSize) + 1;
    if (page !== state.page) {
      state.page = page;
      renderGrid();
      renderPager();
    }
  }

  function closeLightbox() {
    var video = el.stage.querySelector('video');
    if (video) video.pause();
    el.stage.textContent = '';
    el.lightbox.classList.remove('active');
    state.lightboxIndex = -1;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function navigate(delta) {
    if (state.lightboxIndex < 0) return;
    openLightbox(state.lightboxIndex + delta);
  }

  /* ---------- wiring ---------- */

  function cacheElements() {
    el.chips = document.getElementById('chips');
    el.search = document.getElementById('search');
    el.pageSize = document.getElementById('pageSize');
    el.sort = document.getElementById('sort');
    el.grid = document.getElementById('grid');
    el.state = document.getElementById('state');
    el.pager = document.getElementById('pager');
    el.prev = document.getElementById('prev');
    el.next = document.getElementById('next');
    el.position = document.getElementById('position');
    el.pageLabel = document.getElementById('pageLabel');

    el.lightbox = document.getElementById('lightbox');
    el.stage = document.getElementById('stage');
    el.lightboxName = document.getElementById('lightboxName');
    el.lightboxMeta = document.getElementById('lightboxMeta');
    el.lightboxActions = document.getElementById('lightboxActions');
    el.navPrev = document.getElementById('navPrev');
    el.navNext = document.getElementById('navNext');
    el.closeX = document.getElementById('closeX');

    el.renameModal = document.getElementById('renameModal');
    el.renameCurrent = document.getElementById('renameCurrent');
    el.renameInput = document.getElementById('renameInput');
    el.renameError = document.getElementById('renameError');
    el.renameCancel = document.getElementById('renameCancel');
    el.renameConfirm = document.getElementById('renameConfirm');
  }

  function bindEvents() {
    el.chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      state.filter = chip.dataset.filter;
      state.page = 1;
      savePrefs();
      computeView();
      render();
    });

    el.search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.query = el.search.value;
        state.page = 1;
        computeView();
        render();
      }, 120);
    });

    el.pageSize.addEventListener('change', function () {
      state.pageSize = parseInt(el.pageSize.value, 10) || 20;
      state.page = 1;
      savePrefs();
      computeView();
      render();
    });

    el.sort.addEventListener('change', function () {
      state.sort = el.sort.value;
      state.page = 1;
      savePrefs();
      computeView();
      render();
    });

    el.prev.addEventListener('click', function () { goToPage(state.page - 1); });
    el.next.addEventListener('click', function () { goToPage(state.page + 1); });

    el.navPrev.addEventListener('click', function () { navigate(-1); });
    el.navNext.addEventListener('click', function () { navigate(1); });
    el.closeX.addEventListener('click', closeLightbox);

    el.lightbox.addEventListener('click', function (e) {
      if (e.target === el.lightbox) closeLightbox();
    });

    el.renameCancel.addEventListener('click', closeRename);
    el.renameConfirm.addEventListener('click', performRename);
    el.renameModal.addEventListener('click', function (e) {
      if (e.target === el.renameModal) closeRename();
    });
    el.renameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performRename();
      }
    });

    document.addEventListener('keydown', function (e) {
      var renameOpen = el.renameModal.classList.contains('active');
      var lightboxOpen = el.lightbox.classList.contains('active');

      if (e.key === 'Escape') {
        if (renameOpen) closeRename();
        else if (lightboxOpen) closeLightbox();
        return;
      }

      if (renameOpen) return;

      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
        return;
      }

      // Typing in the search box should not also page the grid.
      if (document.activeElement === el.search) return;
      if (e.key === 'ArrowLeft') goToPage(state.page - 1);
      if (e.key === 'ArrowRight') goToPage(state.page + 1);
      if (e.key === '/') { e.preventDefault(); el.search.focus(); }
    });
  }

  function init() {
    cacheElements();
    loadPrefs();
    el.pageSize.value = String(state.pageSize);
    el.sort.value = state.sort;
    bindEvents();
    loadManifest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
