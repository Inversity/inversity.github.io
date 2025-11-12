# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based static GitHub Pages site hosted at inversity.github.io. The site uses the "midnight" theme and serves as a documentation/knowledge repository ("brain").

## Repository Structure

- **docs/**: The main content directory for the Jekyll site
  - **_config.yml**: Jekyll configuration file with site settings
  - **_layouts/**: Custom HTML layouts (uses modified midnight theme)
  - **_posts/**: Blog posts (standard Jekyll posts directory)
  - **assets/**: Static assets including PDFs, CSS, fonts, and images
  - **index.md**: Homepage content
  - **about.md**: About page
  - **report.md**: Detailed bug report documentation
  - **_site/**: Generated site output (do not edit manually)

## Development Commands

### Local Development

```bash
# Navigate to the docs directory
cd docs

# Install dependencies (first time only)
bundle install

# Serve the site locally
bundle exec jekyll serve

# Build the site
bundle exec jekyll build
```

The site will be available at `http://localhost:4000` when running locally.

### Important Notes

- All content editing should be done in the `docs/` directory
- The `_site/` directory is auto-generated; never edit files there directly
- After modifying `_config.yml`, restart the Jekyll server for changes to take effect

## Site Configuration

Key settings in [docs/_config.yml](docs/_config.yml):

- **Title**: "brain"
- **Tagline**: "isn't it comfortable?"
- **Theme**: Uses remote theme `pages-themes/midnight@v0.2.0`
- **Domain**: inversity.github.io
- **GitHub Link**: Disabled (`show_github_link: false`)
- **Downloads**: Disabled (`show_downloads: false`)

## Custom Layout

The site uses a custom layout in [docs/_layouts/default.html](docs/_layouts/default.html) that extends the midnight theme with conditional rendering based on `show_github_link` and `show_downloads` configuration flags.

## Git Branch Configuration

- **Main branch**: `deployment` (use this for pull requests)
- The site is deployed from the `deployment` branch

## Content Guidelines

- Markdown pages should include YAML front matter with `layout: default`
- Links to PDFs and other assets use relative paths: `./assets/pdf/filename.pdf`
- The site includes detailed technical documentation (see report.md for an example of comprehensive bug documentation)
