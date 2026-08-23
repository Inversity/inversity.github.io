# ShareX Gallery Worker

A Cloudflare Worker serving a paginated gallery for ShareX uploads stored in an
R2 bucket.

## Features

- **Uniform grid** - fixed 4:3 tiles, 5 columns at desktop, cropped from the top
  so screenshot titlebars stay recognisable
- **Row-major ordering** - newest first, left to right, so tile position maps to
  recency
- **Pagination** - 20 / 50 / 100 / 200 per page, remembered between visits
- **Instant filter, search and sort** - all in memory, no request per change
- **Cached thumbnails** - transformed once per image and stored back in R2
- **Lightbox** - arrow-key navigation, Escape to close, middle-click still opens
  the original in a new tab
- **Silent video tiles** - nothing is downloaded until a video is opened
- **Copy, rename, delete** - inline, without reloading the page
- **Zero Trust** - protected by Cloudflare Access

## Infrastructure

- **R2 bucket**: `sharex-storage`
- **Custom domain**: `sharex.inversity.dev`
- **Account ID**: `85511ece0bc24640e085eba401fc9893`
- **Bindings**: `BUCKET` (R2), `IMAGES` (Cloudflare Images)

## Layout

```
src/
  index.js               router
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
test/                    vitest + @cloudflare/vitest-pool-workers
docs/specs/              design decisions and rationale
```

`styles.css` and `app.client.js` are imported as strings via the `[[rules]]`
Text entry in `wrangler.toml`, which is why they can be real files rather than
template literals.

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | redirects to `/gallery` |
| `/gallery` | GET | the page shell; touches no bucket data |
| `/api/list` | GET | full manifest as JSON, `no-store` |
| `/_thumb/<key>` | GET | cached WebP preview, generated on first request |
| `/<key>` | GET | the original object |
| `/<key>` | DELETE | removes the object and its thumbnail |
| `/<key>` | PATCH | renames; body `{"newName": "..."}` |

## How thumbnails work

The first request for `/_thumb/foo.png` reads the original from R2, transforms
it to a 480px WebP through the Images binding, returns it, and writes the result
to `_thumbs/foo.png.webp` in the background. Every later request is a plain R2
read.

This matters because the Images binding does not cache. Each uncached call fully
decodes and re-encodes the source. Persisting the output turns a per-request
cost into a once-per-file cost: roughly one transformation per image for its
lifetime, against a free-plan allowance of 5,000 unique transformations a month.

Sources over 20 MB, SVGs, videos and other files skip the pipeline and redirect
to the original.

## Development

```bash
npm install
npm test          # 73 tests, no Cloudflare account needed
npm run dev       # local worker, simulated R2, safe sandbox
npm run dev:live  # local worker, REAL bucket (see below)
npm run deploy    # requires wrangler login
```

`npm test` runs entirely against Miniflare, including a working local Images
binding, so it needs no authentication.

### Working against real data

`npm run dev` is fully sandboxed: R2 is simulated in `.wrangler/state` and bound
to `sharex-storage-preview`, so nothing you click touches real uploads. That
also means the gallery is empty, because the preview bucket is.

`npm run dev:live` uses the `live` environment, where the R2 binding is marked
`remote = true`. Worker code still runs locally, but every bucket call is
proxied to the real `sharex-storage`. Two consequences:

- delete and rename operate on **real uploads**
- browsing generates real thumbnails into `_thumbs/`, which pre-warms the cache

Never `wrangler deploy -e live`. It would publish a second Worker named
`sharex-gallery-live`. Production uses the default environment, where bindings
are real by definition.

### Two local-tooling gotchas

`wrangler dev --remote` is the legacy fully-remote mode, and it is **not** what
you want here. It uploads your code to a temporary preview environment. The
current mechanism is per-binding `remote = true`, which is what the `live`
environment uses.

`wrangler r2 object put --local` writes to a different local store layout than
`wrangler dev` reads from, so objects seeded that way are invisible to the dev
server. Use `npm run dev:live` instead of trying to seed local data.

## Deployment

This Worker is independent of the Jekyll site in `docs/`. It does not deploy
from the `deployment` branch and no GitHub Action touches it.

```bash
npx wrangler login
npm run deploy
```

## License

MIT
