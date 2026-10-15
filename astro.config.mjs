// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile } from 'node:fs/promises';

// @astrojs/sitemap writes sitemap-index.xml + sitemap-0.xml; also publish the
// URL list at the conventional /sitemap.xml. Must run after sitemap().
/** @type {import('astro').AstroIntegration} */
const sitemapXml = {
  name: 'sitemap-xml',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir));
    },
  },
};

export default defineConfig({
  // www is the live host (the apex 301s to it), so canonicals and the sitemap use it
  site: 'https://www.ducthunt.com',
  trailingSlash: 'ignore',
  // Page CSS is small. Inlining it removes the render-blocking stylesheet.
  build: { inlineStylesheets: 'always' },
  // Plain urlset: only the namespace the URLs use
  integrations: [sitemap({ namespaces: { news: false, xhtml: false, image: false, video: false } }), sitemapXml],
});
