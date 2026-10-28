// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// The /blog/ index stays out of the sitemap (and is noindex) until the first post exists.
const hasPosts = readdirSync(new URL('./src/content/blog/', import.meta.url)).some((f) => f.endsWith('.md') && !f.startsWith('_'));

// <lastmod> (YYYY-MM-DD): posts use frontmatter updated|date, /blog/ the newest
// post date, other pages the last git commit date of their source file (else build date).
const ymd = (d) => new Date(d).toISOString().slice(0, 10);
const buildDate = ymd(Date.now());
const postDates = {};
for (const f of readdirSync(new URL('./src/content/blog/', import.meta.url))) {
  if (!f.endsWith('.md') || f.startsWith('_')) continue;
  const fm = (readFileSync(new URL(`./src/content/blog/${f}`, import.meta.url), 'utf8').match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm')) || [])[1];
  const slug = (fm.match(/^slug:\s*['"]?([a-z0-9-]+)/m) || [])[1];
  const d = get('updated') || get('date');
  if (slug && d) postDates[slug] = d;
}
const newestPost = Object.values(postDates).sort().pop();
const gitDate = (file) => {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${file}"`, { encoding: 'utf8' }).trim();
    return out || null;
  } catch { return null; }
};
const lastmodFor = (url) => {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
  const m = path.match(/^blog\/([^/]+)$/);
  if (m) return postDates[m[1]] || buildDate;
  if (path === 'blog') return newestPost || buildDate;
  const base = `src/pages/${path || 'index'}`;
  const file = [`${base}.astro`, `${base}/index.astro`].find((f) => existsSync(f));
  return (file && gitDate(file)) || buildDate;
};

// @astrojs/sitemap writes sitemap-index.xml + sitemap-0.xml; also publish the
// URL list at the conventional /sitemap.xml. Must run after sitemap().
/** @type {import('astro').AstroIntegration} */
const sitemapXml = {
  name: 'sitemap-xml',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      // Trim lastmod to YYYY-MM-DD
      const src = new URL('sitemap-0.xml', dir);
      const xml = (await readFile(src, 'utf8')).replace(/<lastmod>(\d{4}-\d{2}-\d{2})T[^<]*<\/lastmod>/g, '<lastmod>$1</lastmod>');
      await writeFile(src, xml);
      await copyFile(src, new URL('sitemap.xml', dir));
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
  integrations: [
    sitemap({
      namespaces: { news: false, xhtml: false, image: false, video: false },
      filter: (page) => hasPosts || page !== 'https://www.ducthunt.com/blog/',
      serialize: (item) => ({ ...item, lastmod: lastmodFor(item.url) }),
    }),
    sitemapXml,
  ],
});
