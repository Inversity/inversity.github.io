# ShareX Gallery: pagination, ordering, thumbnails, refactor

Date: 2026-08-23
Status: approved

## Problem

The gallery at `sharex.inversity.dev` renders every object in the `sharex-storage`
R2 bucket into a single HTML page. At ~500 images and ~100 videos this has three
distinct failures.

### 1. Ordering appears random

`src/index.js` sorts objects newest-first, then lays them out with CSS
`column-count: 4`. CSS multi-column fills column 1 top to bottom, then column 2,
and so on. With 500 images the browser divides total height by four and pours the
sorted list in vertically.

The visible top row is therefore items 1, 126, 251, and 376: four unrelated dates
sitting side by side. The sort is correct but invisible, because reading order is
vertical while scanning is horizontal.

### 2. Silent truncation at 1000 objects

`bucket.list()` returns at most 1000 objects and sets `truncated`. The current
code ignores `truncated` and never passes a cursor. At 1000 files the gallery
stops showing new uploads with no error.

### 3. Full-resolution images used as thumbnails

Every `<img>` points at the original object. 500 screenshots at roughly 1 MB
each. `loading="lazy"` defers the transfer but does not reduce it. Separately,
all ~100 videos render as `<video preload="metadata">`, firing ~100 range
requests on load.

## Decisions

| Area | Decision |
|---|---|
| Pagination | Client-side, from a single cached JSON manifest |
| Layout | CSS Grid, fixed tiles, `object-fit: cover` anchored top |
| Columns | 5 at desktop, stepping to 4 / 3 / 2 / 1 |
| Page sizes | 20 / 50 / 100 / 200 |
| Thumbnails | Images binding, result cached back into R2 under `_thumbs/` |
| Grouping | One unified date-sorted stream with filter chips |
| Video tiles | Silent placeholder, loads only on click |
| Click target | Lightbox, with middle/ctrl click preserved for new tab |
| Structure | Split into ES modules, no new build tooling |

Five columns is the only count dividing evenly into all four page sizes
(20, 50, 100, 200 give exactly 4, 10, 20 and 40 full rows). Four columns leaves
50 ragged at 12.5 rows.

## Architecture

```
src/
  index.js               router only
  handlers/
    manifest.js          GET  /api/list
    thumb.js             GET  /_thumb/<key>
    file.js              GET  /<key>
    mutate.js            DELETE, PATCH /<key>
  lib/
    classify.js          extension -> image | video | file
    keys.js              thumb keys, reserved paths, filename sanitizing
  ui/
    shell.js             assembles the HTML document
    styles.css           real CSS, imported as a Text module
    app.client.js        real JS, imported as a Text module
```

Client-side rendering means all formatting lives in `app.client.js`. It is
deliberately self-contained rather than sharing helpers with the Worker, because
Text modules cannot import. The duplicated surface is two small functions
(byte and date formatting).

### Data flow

```
GET /gallery
  static HTML, inlined CSS and JS. No R2 access.

GET /api/list
  cursor loop over bucket.list({limit: 1000}) until truncated is false
  drop keys under _thumbs/
  emit [{k, s, u, t}]  = key, size, uploaded epoch ms, type
  ~600 items = ~50 KB, ~15 KB gzipped
  Cache-Control: no-store, so deletes are never stale

GET /_thumb/<key>
  hit  in _thumbs/  -> stream, immutable 1 year, no transformation
  miss              -> source > 20 MB or not raster? 302 to original
                       IMAGES.input(body).transform({width: 480})
                             .output({format: "image/webp"})
                       respond now, ctx.waitUntil() the R2 write
```

Cost is roughly 600 transformations total, one per image for its lifetime, not
600 per month. The Images free plan allows 5,000 unique transformations per
month. The Images binding does not cache on its own and re-decodes on every
uncached call, which is precisely what caching into R2 avoids.

## Correctness fixes carried along

- Cursor loop removes the 1000-object ceiling.
- Tiles are built with DOM APIs rather than string concatenation, so filenames
  cannot break out into markup. The current code interpolates `obj.key` raw into
  both attributes and text.
- Delete and rename mutate the in-memory manifest and re-render, preserving page,
  filter and scroll position. No full reload.
- Delete removes the object and its thumbnail in one `bucket.delete([a, b])`.
- Rename deletes the stale thumbnail and lets it regenerate on next view.
- `_thumbs/` is excluded from the manifest. `/gallery`, `/api/`, and `/_thumb/`
  are reserved against filename collision.

## Error handling

| Failure | Behavior |
|---|---|
| R2 list fails | Error card with Retry, page shell survives |
| Transform fails, or source over 20 MB | 302 to original, tile still renders |
| Thumbnail write fails | Response already sent, retried on next view |
| Delete or rename fails | Tile reverts, inline error, no reload |
| Empty bucket vs empty filter | Distinct empty states |

## Testing

`vitest` with `@cloudflare/vitest-pool-workers`, which provides a local R2 and a
working local Images binding via Miniflare. 73 tests across 6 files.

- `lib/` units: classification, key derivation, filename sanitizing
- `listAll`: a paging bucket stub proves the cursor loop across 2500 objects,
  and that a non-advancing cursor breaks the loop instead of hanging
- manifest handler: ordering, `_thumbs/` exclusion, type tagging, no-store
- thumb handler with a stubbed transformer: miss writes to R2, hit skips the
  transform, oversize and non-raster sources redirect, failures degrade
- thumb handler against the **real** Images binding: a 1000px PNG fixture
  produces a genuine 480px WebP smaller than the source, and the cached copy is
  the transformed bytes rather than the original
- mutate handler: delete removes both objects, rename collision returns 409,
  traversal attempts are flattened
- router: every route, method guards, percent-decoding, and an assertion that
  the served HTML contains strings from both Text modules

### What is not unit tested

The client (`app.client.js`) ships as a Text module and cannot be imported by
the Worker test runner, so its pagination, filtering and lightbox logic have no
unit coverage. Extracting shared helpers would only test a copy of the code
rather than the code that runs, which is worse than not testing it.

It was instead verified in a real browser against a harness serving the actual
shell and client with 137 synthetic items, measuring rather than eyeballing:

- 5 columns at 1720px, 4 at 1300px, 1 at 560px, no horizontal overflow at any
- exactly one distinct tile height per viewport, across mixed source aspect
  ratios (1920x1080, 600x1400, 2560x1080, 1024x1024)
- row-major ordering: positions 1-5 across the first row, 6-10 the second
- 50 per page yields exactly 10 full rows; the last page of 137 at 100 per page
  holds 37 tiles with Next disabled
- page 2 begins at item 51, contiguous with page 1
- filter chips, filename search and sort all recompute without a request
- zero `<video>` elements in the grid at rest; the lightbox creates one on click
- arrow keys advance the lightbox, Escape closes it
- delete removes the tile while preserving page 3 and the filter, with a
  sentinel variable proving no page reload occurred
- no console errors or warnings

## Verified against the real bucket

Run locally with the R2 binding proxied to `sharex-storage` (the `live`
environment), 2026-08-23:

- 661 objects: 553 images (122.2 MB), 107 videos (4930.2 MB), 1 other file
- a 5,105,203 byte PNG transformed to a 33,164 byte WebP, confirmed by magic
  bytes (`RIFF....WEBP`). 154x smaller.
- second request served `X-Thumb: hit` in 0.18s with byte-identical output,
  proving the R2 thumbnail cache works against the live bucket
- thumbnail widths capped at 480 and never upscaled: sources already narrower
  came back at their original width
- one distinct tile height across 20 real screenshots of varying dimensions
- page 1 of 34, ordering strictly newest first

Bandwidth for the first screen went from 24.4 MB of originals to 0.63 MB of
thumbnails. The previous version put all 661 items on one page, which meant
122 MB of image tags plus 107 `<video preload="metadata">` elements pointing at
4.9 GB of video.

## Known risks

**Thumbnail staleness on key reuse.** Thumbnails are immutable per key. An object
replaced in place at the same key would keep its old thumbnail. ShareX generates
unique names, so this is theoretical.

## Resolved during implementation

**Text module rule for `app.client.js`** (flagged as a risk): works. The router
test asserts that a string defined inside `app.client.js` appears in the served
HTML, which only holds if the rule beat Wrangler's default ESModule rule.

**Test runner API change.** `@cloudflare/vitest-pool-workers` 0.22 removed the
`defineWorkersConfig` helper and the `./config` export entirely. The current API
is a Vite plugin, `cloudflareTest()`, from the package root. The pool also
requires `nodejs_compat`, which is set in `vitest.config.js` rather than
`wrangler.toml` so the deployed runtime is unchanged.

**Fixed tiles needed the preview out of flow.** An in-flow `<img>` carries its
own intrinsic aspect ratio, which overrides the container's `aspect-ratio` and
stretches the tile back to the image's shape. The first browser check showed
ragged tiles for exactly this reason. Absolutely positioning the preview inside
an `overflow: hidden` container is what actually makes tiles uniform.

## Explicitly out of scope

The Worker performs no authentication of its own. `DELETE` and `PATCH` on any
path succeed for anyone who can reach the hostname, and Cloudflare Access is the
only control in front of it. Giving the Worker its own auth is a separate piece
of work and is not addressed here.

### One exception, fixed at deploy time

Access protects `sharex.inversity.dev` only. The workers.dev subdomain routed to
the same Worker with nothing in front of it. Confirmed on deploy:
`sharex-gallery.inversity.workers.dev/api/list` returned all 661 filenames to an
unauthenticated request, and the same origin would have accepted `DELETE` on any
key.

Fixed with `workers_dev = false`, which is now load-bearing rather than
cosmetic. The subdomain returns 404. This was pre-existing rather than
introduced by this work, but it was live and one line to close.

## Deployment

Unchanged: `npm run deploy` from `sharex-gallery/`. This Worker is independent of
the Jekyll site and the `deployment` branch that drives GitHub Pages.
