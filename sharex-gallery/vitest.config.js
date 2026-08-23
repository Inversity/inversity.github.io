import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        // Required by vitest-pool-workers itself. Kept here rather than in
        // wrangler.toml so the deployed Worker's runtime is unchanged.
        compatibilityFlags: ['nodejs_compat']
      }
    })
  ]
});
