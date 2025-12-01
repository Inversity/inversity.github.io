# ShareX Gallery Worker

A Cloudflare Worker that serves a public gallery for ShareX uploads stored in an R2 bucket.

## Features

- 🎨 **Dark Midnight Theme** - Matches the inversity.dev Jekyll site aesthetic
- 🖼️ **Masonry Gallery Layout** - Responsive grid for images
- 📊 **File Management** - Displays both images and other file types
- 📋 **Copy URLs** - One-click clipboard copying for file URLs
- 📱 **Mobile Responsive** - Works beautifully on all devices
- ⚡ **Fast** - Powered by Cloudflare Workers at the edge

## Infrastructure

- **R2 Bucket**: `sharex-storage`
- **Custom Domain**: `sharex.inversity.dev`
- **Account ID**: `85511ece0bc24640e085eba401fc9893`

## Setup

### Prerequisites

1. Node.js installed
2. Wrangler CLI installed (`npm install -g wrangler`)
3. Authenticated with Cloudflare (`wrangler login`)

### Installation

```bash
cd sharex-gallery
npm install
```

### Development

Run the Worker locally:

```bash
npm run dev
```

This will start a local development server at `http://localhost:8787`

### Deployment

Deploy to Cloudflare:

```bash
npm run deploy
```

Or manually:

```bash
wrangler deploy
```

## Configuration

The Worker is configured in `wrangler.toml`:

- **R2 Binding**: `BUCKET` → `sharex-storage`
- **Route**: `sharex.inversity.dev/*`
- **Zone**: `inversity.dev`

## How It Works

1. **Root Path (`/`)**: Lists all objects in the R2 bucket and renders a gallery HTML page
2. **File Paths (`/<filename>`)**: Serves the actual file from R2 with appropriate caching headers

## Styling

The gallery matches the dark midnight theme from the main inversity.dev site:
- Dark background gradients (#0d0d0d to #1a1a1a)
- Red accent colors (rgba(139, 0, 0, ...))
- Masonry grid layout with 4 columns (responsive)
- Hover effects with shadows and transforms

## File Support

### Images (Masonry Grid)
- JPG/JPEG
- PNG
- GIF
- WebP
- BMP
- SVG

### Other Files (List View)
- Documents (PDF, DOC, TXT)
- Archives (ZIP, RAR, 7Z)
- Videos (MP4, MOV, AVI)
- Audio (MP3, WAV)
- And more...

## ShareX Configuration

Make sure your ShareX is configured to upload to:
```
https://sharex.inversity.dev/
```

The Worker will automatically display new uploads in the gallery.

## Performance

- Gallery list cached for 5 minutes
- Individual files cached for 1 year
- Stays within Cloudflare's free tier (100k requests/day)

## License

MIT
