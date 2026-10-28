// Static SEO checks over the built site in dist/. Run after `npm run build`:
//   node scripts/seo-audit.mjs
// Exits non-zero on any error-level finding.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://www.ducthunt.com';
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else if (f.endsWith('.html')) files.push(p);
});
walk(DIST);

const errors = [];
const warns = [];
const err = (r, m) => errors.push(`${r}: ${m}`);
const warn = (r, m) => warns.push(`${r}: ${m}`);
// A bare attribute (e.g. Astro's `alt` for alt="") reads as ''
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)")?(?=[\\s>/])`));
  return m ? (m[1] ?? '') : undefined;
};
const meta = (html, key, val) => {
  const tag = html.match(new RegExp(`<meta[^>]*${key}="${val}"[^>]*>`))?.[0];
  return tag ? attr(tag, 'content') : undefined;
};
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

const titles = new Map();
const descs = new Map();
const h1s = new Map();
const rows = [];

let emptyBlog = false;
for (const f of files.sort()) {
  const html = readFileSync(f, 'utf8');
  const route = '/' + relative(DIST, f).replace(/index\.html$/, '');
  if (/http-equiv="refresh"/.test(html)) { rows.push({ route, note: 'redirect stub' }); continue; }
  // The empty /blog/ index (no posts yet) is intentionally noindex and out of the sitemap, like the 404 page
  const is404 = route === '/404.html' || (route === '/blog/' && /<meta name="robots" content="noindex"/.test(html));
  if (route === '/blog/' && is404) emptyBlog = true;

  if (!/<html lang="en"/.test(html)) err(route, 'missing <html lang="en">');
  if (!/<meta name="viewport" content="width=device-width, initial-scale=1"/.test(html)) err(route, 'viewport meta missing/incorrect');

  const title = text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const desc = meta(html, 'name', 'description') ?? '';
  if (!title) err(route, 'no <title>');
  if (title.length > 60) warn(route, `title ${title.length} chars (>60): "${title}"`);
  if (!desc) err(route, 'no meta description');
  if (desc.length > 155) warn(route, `description ${desc.length} chars (>155)`);
  titles.set(title, [...(titles.get(title) ?? []), route]);
  descs.set(desc, [...(descs.get(desc) ?? []), route]);

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const robots = meta(html, 'name', 'robots') ?? '';
  if (!is404) {
    if (!canonical) err(route, 'no canonical');
    else if (canonical !== SITE + route) err(route, `canonical ${canonical} != ${SITE + route}`);
  } else if (!/noindex/.test(robots)) err(route, '404 page is not noindex');

  for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    const v = meta(html, 'property', p);
    if (!v && !is404) err(route, `missing ${p}`);
    if (p === 'og:image' && v && !v.startsWith(SITE)) err(route, `og:image not absolute on ${SITE}: ${v}`);
  }
  for (const n of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!meta(html, 'name', n) && !is404) err(route, `missing ${n}`);
  }
  if (/twitter:site|lovable/i.test(html)) err(route, 'template leftover (twitter:site / lovable)');

  // Headings, in document order
  const heads = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ l: +m[1], t: text(m[2]) }));
  const ones = heads.filter((h) => h.l === 1);
  if (ones.length !== 1) err(route, `${ones.length} H1s`);
  if (ones[0]) h1s.set(ones[0].t, [...(h1s.get(ones[0].t) ?? []), route]);
  let prev = 0;
  heads.forEach((h) => {
    if (prev && h.l > prev + 1) err(route, `heading skip h${prev} -> h${h.l} ("${h.t}")`);
    prev = h.l;
  });

  // Images
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  imgs.forEach((t, i) => {
    const alt = attr(t, 'alt');
    const src = attr(t, 'src');
    if (alt === undefined) err(route, `img without alt: ${src}`);
    else if (/\.(jpe?g|png|webp|avif)$|^(image|img|photo)\d*$/i.test(alt)) err(route, `filename-like alt "${alt}"`);
    if (!attr(t, 'width') || !attr(t, 'height')) warn(route, `img without width/height: ${src}`);
    if (src && !/\.(webp|avif|svg)$/.test(src.split('?')[0])) warn(route, `non-modern format: ${src}`);
  });
  if (/PHOTO ·|PLACEHOLDER|Placeholder:|\[to be confirmed\]|\[guarantee details/i.test(text(html.replace(/<script[\s\S]*?<\/script>/g, '')))) err(route, 'visible placeholder text');

  // JSON-LD
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const nodes = blocks.flatMap((b) => b['@graph'] ?? [b]);
  const types = nodes.map((n) => [].concat(n['@type']).join('+'));
  const ids = new Set(nodes.map((n) => n['@id']).filter(Boolean));
  if (!is404) {
    if (blocks.length !== 1) err(route, `${blocks.length} JSON-LD blocks (want one @graph)`);
    if (!types.some((t) => /HVACBusiness/.test(t))) err(route, 'no HVACBusiness node');
    if (!types.includes('WebSite')) err(route, 'no WebSite node');
    if (route !== '/' && !types.includes('BreadcrumbList')) err(route, 'no BreadcrumbList');
    if (route !== '/' && !/aria-label="Breadcrumb"/.test(html)) err(route, 'no visible breadcrumb');
    // every {"@id": ...} reference must resolve within the page graph
    JSON.stringify(nodes).replace(/\{"@id":"([^"]+)"\}/g, (_, id) => { if (!ids.has(id)) err(route, `dangling @id ref ${id}`); });
    // FAQPage answers must be visible on the page verbatim
    const visible = text(html.replace(/<script[\s\S]*?<\/script>/g, ''));
    nodes.filter((n) => n['@type'] === 'FAQPage').forEach((n) => n.mainEntity.forEach((q) => {
      if (!visible.includes(q.name)) err(route, `FAQ question not visible: ${q.name}`);
      if (!visible.includes(q.acceptedAnswer.text)) err(route, `FAQ answer not visible: ${q.name}`);
    }));
  }
  if (!/href="#main"/.test(html)) err(route, 'no skip link');
  rows.push({ route, title: title.length, desc: desc.length, h1: ones[0]?.t, imgs: imgs.length, schema: types.join(', ') });
}

for (const [t, r] of titles) if (r.length > 1) err(r.join(', '), `duplicate title "${t}"`);
for (const r of descs.values()) if (r.length > 1) err(r.join(', '), 'duplicate description');
for (const [h, r] of h1s) if (r.length > 1) err(r.join(', '), `duplicate H1 "${h}"`);

if (!existsSync(join(DIST, '404.html'))) err('/404.html', 'missing (Cloudflare Pages falls back to serving / with 200)');
const robotsTxt = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!/Sitemap: https:\/\/www\.ducthunt\.com\/sitemap\.xml/.test(robotsTxt)) err('robots.txt', 'missing sitemap line');
if (/Disallow:\s*\/(_astro|assets)/.test(robotsTxt)) err('robots.txt', 'blocks asset paths');
const sm = existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
rows.filter((r) => !r.note && r.route !== '/404.html' && !(r.route === '/blog/' && emptyBlog)).forEach((r) => {
  if (!smUrls.includes(SITE + r.route)) err(r.route, 'not in sitemap.xml');
});
smUrls.forEach((u) => { if (!rows.some((r) => SITE + r.route === u && !r.note)) err(u, 'sitemap URL has no page'); });

console.table(rows);
warns.forEach((w) => console.log('WARN ', w));
errors.forEach((e) => console.log('ERROR', e));
console.log(`\n${errors.length} errors, ${warns.length} warnings`);
process.exit(errors.length ? 1 : 0);
