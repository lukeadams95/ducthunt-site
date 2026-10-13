// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ducthunt.com',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  // The Duct Repair & Sealing page was removed; send old links to the light repair section
  redirects: {
    '/services/duct-repair-sealing': '/services/air-duct-cleaning/#light-duct-repair',
  },
});
