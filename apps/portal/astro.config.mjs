import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical origin — Cloudflare Pages production URL. Required for
  // sitemap generation and the canonical/OG URLs in Layout.astro.
  site: 'https://blueprint-platform.pages.dev',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      // packages/ui consumes Radix peer deps; let Vite resolve them through the workspace
      noExternal: ['@blueprint/ui', '@blueprint/design-tokens'],
    },
  },
});
