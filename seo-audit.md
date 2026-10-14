# On-site SEO audit: ducthunt.com

**Date:** 2026-10-14
**Method:** I read every source file under `src/`, `public/`, `functions/` and `astro.config.mjs`. Then I built the site and checked every page in `dist/` with `scripts/seo-audit.mjs`, a script added in this change. I also fetched the live site with curl and looked at each changed page in headless Chromium at 1280px and 390px wide.

**Stack note:** The brief describes a "prerendered Vite/React SPA". This site is actually **Astro 7 with static output**: zero client framework, and every page is real HTML at build time. The checks below are adapted to that. All fixes were made in `src/`, `public/` and `astro.config.mjs`, not in `dist/`, so they survive every build.

**Result:** The audit script went from **111 errors and 9 warnings** to **0 errors and 0 warnings**. Run `npm run build && npm run audit:seo` to check again.

---

## Scores

| # | Category | Before | After |
|---|---|---|---|
| 1 | Prerendering (SSG) | 100 | 100 |
| 2 | Heading structure | 82 | 90 |
| 3 | Meta tags | 50 | 97 |
| 4 | Images | 74 | 88 |
| 5 | Structured data (JSON-LD) | 30 | 82 |
| 6 | URL & routing | 50 | 95 |
| 7 | Internal linking & navigation | 68 | 95 |
| 8 | Performance (code level) | 74 | 80 |
| 9 | Accessibility & mobile | 80 | 92 |

### What produced each score

**1. Prerendering: 100 → 100**
- Astro `output: 'static'` writes one `index.html` per page with all content in the HTML: 9 indexable pages, plus `404.html` after this change. JavaScript only adds behavior: the menu, the FAQ accordion, forms and the before/after slider. Content is present even with JavaScript turned off. The FAQ answers only collapse after the script adds a `.js` class (`src/pages/faq.astro:16`). Nothing to deduct.

**2. Headings: 82 → 90**
- Before:
  - −8: the H1s on `/`, `/services/` and `/service-area/` were nearly the same ("Air Duct & Dryer Vent Cleaning [Services] in/Across …Kansas City"), so the pages competed for the same query.
  - −4: the `/faq/` H1 "Frequently Asked Questions" and the `/quote/` H1 "Get Your Free Quote" didn't name the topic.
  - −6: "Kansas City" is repeated across H2s (see P2-1).
- After:
  - −6: the "Kansas City" repetition is still there (P2-1).
  - −2: the homepage has two H2s that both read "Get Your Free Quote …" (the quick-quote bar and the bottom form).
  - −2: the footer column labels are H2s. That's acceptable, but they add four H2s to every page's outline.
- Already correct before this change:
  - Exactly one H1 on every page.
  - No skipped heading levels on any page (the script checks this).
  - No headings used purely for styling. Display lines such as "That's how we do business." are already `<p>`.

**3. Meta tags: 50 → 97**
- Before:
  - −20: no `og:image` on any page.
  - −15: no Twitter card tags at all.
  - −8: 6 titles over 60 characters.
  - −4: 4 descriptions over 155 characters.
  - −3: the `/services/` description advertised "duct repair & sealing", a page that was removed.
- After:
  - −3: six pages share the default share image (the trailer photo). Only `/services/dryer-vent-cleaning/` and `/why-duct-hunt/` have their own.
- Already correct before this change:
  - `lang="en"` and the viewport tag are right.
  - Canonical tags exist on every page.
  - All titles and descriptions are unique.
  - No leftover Lovable or template `twitter:site` tags.

**4. Images: 74 → 88**
- Before:
  - −8: two visible "PHOTO · …" placeholder boxes were live on the public site.
  - −6: the service card alt text said "Truck-mounted duct cleaning equipment", but the photo shows a portable duct vacuum and collection bag.
  - −6: the 2.5 MB hero video is set to `preload="auto"`.
  - −6: the video poster (the likely LCP element) was not preloaded.
- After:
  - −8: the 2.5 MB hero video is still there (P1-4).
  - −4: the poster is a 134 KB JPEG in `public/`, which the image pipeline doesn't convert to WebP/AVIF.
- Already correct before this change:
  - Every `<img>` goes through `astro:assets`, which converts to WebP, adds explicit `width`/`height` (no layout shift) and lazy-loads by default.
  - Hero images use `loading="eager"`.
  - Decorative background photos use `alt=""`.

**5. Structured data: 30 → 82**
- Before:
  - −15: generic `LocalBusiness` instead of a specific type, with no `@id`, `url`, `image`, `logo`, `geo` or `sameAs`.
  - −15: separate islands that didn't link to each other. Each `Service.provider` was a nameless inline `LocalBusiness` copy, and there was no WebSite node and no Organization identity.
  - −10: no BreadcrumbList anywhere.
  - −10: `/faq/` FAQPage schema published the literal answers `"[to be confirmed]"` and `"[guarantee details to be confirmed]"`.
  - −10: no schema at all on `/quote/`.
  - −10: none of the NAP data (name, address, phone) was tied to the Google Business Profile.
- After:
  - −10: rating (4.9), review count (54) and hours (Mon–Fri 8–7) can't be checked against Google here, and the README lists hours as unconfirmed (P1-1).
  - −5: `sameAs` lists only the Google Business Profile, because no social or directory profiles are known (P1-2).
  - −3: the address is city and state only, with no street or ZIP. That's correct for a service-area business, but weaker for local matching.

**6. URL & routing: 50 → 95**
- Before:
  - −35: **soft 404s.** Any unknown URL returned the homepage with HTTP 200 (P0-1).
  - −10: the removed `/services/duct-repair-sealing/` page was an HTML meta-refresh redirect returning 200, not a 301.
  - −5: no custom 404 page.
- After:
  - −5: the old URL is a 301 to a section of another page (`#light-duct-repair`), which passes less relevance than a dedicated page. That's fine for a removed service, but it's the only remaining deduction.
- Already correct before this change:
  - URLs are clean and lowercase.
  - The trailing slash is consistent everywhere: Cloudflare 308s `/faq` to `/faq/`, and canonicals, the sitemap and every internal link already use the slash form. No custom slash rules were added.
  - The sitemap is generated from the real page list at build time.
  - `robots.txt` doesn't block `/_astro/`.

**7. Internal linking & navigation: 68 → 95**
- Before:
  - −15: no breadcrumbs.
  - −12: the footer linked only the two service pages. Reviews, Why Duct Hunt, Service Area, FAQ and Quote were reachable only through the header menu.
  - −5: no page links to `/services/` except the header.
- After:
  - −5: the services dropdown is hover/focus only (P2-4).
- No orphan pages before or after. Navigation is semantic `<nav>` and `<a>`.

**8. Performance (code level): 74 → 80**
- Before:
  - −10: Google Fonts CSS blocks rendering and loaded 3 families. JetBrains Mono was only used for the placeholder notes.
  - −10: the homepage hero loads a 2.5 MB autoplay video.
  - −6: the hero poster image was not preloaded.
- After:
  - −10: Google Fonts is still loaded from a third party and blocks rendering. It now loads 2 families and uses `display=swap` (P1-3).
  - −10: the video weight is unchanged (P1-4).
- Already correct before this change:
  - Total CSS is about 37 KB, split per page.
  - Page JavaScript is under 3 KB, as small modules.
  - The gtag script is `async`.
  - The Feedbucket widget only loads on the staging domain.
  - Map iframes use `loading="lazy"`.

**9. Accessibility & mobile: 80 → 92**
- Before:
  - −10: no skip link.
  - −5: the `<main>` element couldn't take focus for a skip link.
  - −5: the placeholder boxes used `role="img"` with "Photo placeholder" labels.
- After:
  - −4: `aria-haspopup` on a plain link (P2-4).
  - −4: color contrast was not measured (see "What I could not verify").
- Already correct before this change:
  - `header`, `main`, `footer`, `nav`, `section` and `article` are used correctly.
  - Touch targets are at least 44px.
  - The mobile menu has `aria-expanded` and closes with Escape.
  - Before this change's breadcrumb and footer additions, no page overflowed horizontally at 390px. I checked every changed page after the change and none do.

---

## Issues by priority

Status: **Fixed** = changed in this commit. **Open** = needs a person, data I don't have, or a decision.

### P0: blocks indexing or quality

| ID | Issue | Where | Status |
|---|---|---|---|
| P0-1 | **Soft 404s.** `https://www.ducthunt.com/this-page-does-not-exist` returned **200** with the homepage. Cloudflare Pages treats a site with no `404.html` as a single-page app, so every bad or old link looks like a duplicate homepage to Google. | `src/pages/` (no 404 page) | Fixed: `src/pages/404.astro` (noindex, links to key pages). Cloudflare now serves `dist/404.html` with a real 404 status. |
| P0-2 | **Placeholder text visible on the live site:** "PLACEHOLDER · Guarantee details to be confirmed by Derek", "Placeholder: confirm same-day quote timing with Derek." and two "PHOTO · …" boxes. | `src/pages/why-duct-hunt.astro:110`, `src/pages/quote.astro:103`, `src/pages/services/index.astro:102`, `src/pages/why-duct-hunt.astro:52` (old line numbers) | Fixed: notes removed; the pricing box now uses the real truck and trailer photo; the Derek box is removed until a portrait exists. |
| P0-3 | **FAQPage schema published placeholder answers** ("[to be confirmed]" ×2, "[guarantee details to be confirmed]"), and the same text was visible on `/faq/`. | `src/data/faqs.ts:68,90,120` | Fixed: these now use the same "call and we'll confirm" answers already shown on the dryer and service-area pages, and the guarantee line already used on the Why page. Nothing new was made up. |

### P1: real ranking or rich-result impact

| ID | Issue | Where | Status |
|---|---|---|---|
| P1-1 | **Schema was separate islands with a generic type.** Each page emitted its own `LocalBusiness` with no `@id`; each `Service.provider` was a separate inline `{ "@type": "LocalBusiness", "name": … }`; there was no WebSite node, no logo, url, image, geo or sameAs; and `/quote/` had no schema. | `src/data/schema.ts` (all), `src/layouts/Base.astro:53` | Fixed: one `@graph` per page. `HVACBusiness` `#business` → `WebSite` `#website` (publisher → business) → `WebPage` `#webpage` (isPartOf / about / breadcrumb) → `Service` `#service` (provider → business) → `FAQPage` (isPartOf → webpage). The audit script fails if any `@id` reference points at nothing. |
| P1-2 | No **BreadcrumbList** or visible breadcrumbs. | n/a | Fixed: `crumbsFor()` in `src/data/site.ts` follows the header nav and drives both the visible `<nav aria-label="Breadcrumb">` (`src/components/Breadcrumbs.astro`) and the BreadcrumbList schema, so the two always match. |
| P1-3 | No **og:image** and no **Twitter card** tags on any page. | `src/layouts/Base.astro` | Fixed: a 1200×628 JPEG is generated at build time from `src/assets` (dryer and why pages use their own photo), with `og:image:width/height/alt`, `og:locale`, `twitter:card=summary_large_image` and `twitter:title/description/image/image:alt`. |
| P1-4 | **Removed page redirected with meta-refresh + 200**, not a 301. | `astro.config.mjs` `redirects` | Fixed: `public/_redirects` sends both `/services/duct-repair-sealing` and `/services/duct-repair-sealing/` to `/services/air-duct-cleaning/#light-duct-repair` with a 301. The Astro rule was removed so there's only one source of truth. |
| P1-5 | **Titles over 60 characters** on `/` (61), `/services/` (66), `/service-area/` (71), `/why-duct-hunt/` (67), `/quote/` (65). **Descriptions over 155** on `/services/` (159), `/service-area/` (158), `/services/air-duct-cleaning/` (162), `/why-duct-hunt/` (164). | page front matter | Fixed: all indexable titles are now 41–60 characters and all descriptions 128–154. Each still leads with the main keyword. |
| P1-6 | **H1 overlap** between `/` and `/services/`, plus non-topical H1s on `/faq/` and `/quote/`. | `src/pages/services/index.astro:59`, `faq.astro:19`, `quote.astro:21` | Fixed: "Duct Cleaning Services for Kansas City Homes", "Air Duct & Dryer Vent Cleaning FAQ", "Get Your Free Duct Cleaning Quote". |
| P1-7 | **Inaccurate alt text:** the service card photo is a portable duct vacuum, not "truck-mounted" equipment; the dryer card photo shows lint being blown out of a vent hood. | `src/data/site.ts` `services[].photo` | Fixed. |
| P1-8 | The `/services/` description advertised "duct repair & sealing", a service page that no longer exists. | `src/pages/services/index.astro:50` | Fixed: now says "light duct repair", which matches the `#light-duct-repair` section. |
| P1-9 | **GBP data can't be confirmed from here:** `rating: '4.9'`, `reviewCount: 54`, hours Mon–Fri 8 AM–7 PM. The README's launch checklist already lists the hours and the rating count as unconfirmed, and they feed `aggregateRating` and `openingHoursSpecification`. | `src/data/site.ts:17,18,25` | **Open.** Check against the Business Profile and edit `site.ts`; schema and page copy update together. |
| P1-10 | **sameAs has only the Google Business Profile.** No Facebook, Yelp, BBB, Nextdoor or Angi profile is referenced anywhere in the repo, and I won't guess URLs. | `src/data/schema.ts:44` | **Open.** Add each real profile URL to `sameAs`. |
| P1-11 | **Google Fonts blocks rendering** (third-party CSS, 7 weights). | `src/layouts/Base.astro:94` | Partly fixed: dropped the unused JetBrains Mono family. Open: self-host Archivo and Russo One (for example `@fontsource-variable/archivo`) and preload the main WOFF2. That removes two third-party connections from the critical path. |
| P1-12 | **2.5 MB autoplay hero video** on the homepage with `preload="auto"`. On mobile this competes with the LCP poster image. | `src/components/HeroVideoLens.astro:13`, `public/videos/dryer-vent.mp4` | Partly fixed: the poster is now preloaded with `fetchpriority="high"` (`src/pages/index.astro`). Open: re-encode to around 600 KB (720p, CRF 28, no audio track) and convert the poster to WebP. |

### P2: polish

| ID | Issue | Where | Status |
|---|---|---|---|
| P2-1 | **"Kansas City" in H2s:** 10 of 15 on `/`, 9 of 16 on air duct, 9 of 17 on dryer vent, 8 of 12 on services (19 H2s use `sub="in Kansas City"` alone). That reads as over-optimized and adds nothing after the H1 sets the location. | e.g. `src/pages/index.astro:81,143,160,247` | **Open (copy decision).** Suggest keeping it in the H1 and one or two H2s per page, and dropping `sub="in Kansas City"` from the rest. |
| P2-2 | No **footer links** to the non-service pages. | `src/components/Footer.astro` | Fixed: added a "Company" column (Why Duct Hunt, Reviews, Service Area, FAQ, Free Quote), "All Services", and a "See all cities" link. |
| P2-3 | No **skip link**; `<main>` couldn't take focus. | `src/layouts/Base.astro` | Fixed: `<a href="#main" class="skip">`, `<main id="main" tabindex="-1">`. |
| P2-4 | `aria-haspopup="true"` on the Services link, which navigates rather than opening an ARIA menu, and the dropdown opens only on hover/focus. | `src/components/Header.astro:41` | Open: remove `aria-haspopup`, or turn the trigger into a disclosure button. |
| P2-5 | Type error left from before this change: `setOpen(menu?.hidden ?? false)`. It doesn't affect the build. | `src/components/Header.astro:92` | Open (`npm run check` reports 1 error). |
| P2-6 | The Derek portrait slot is now text only. A real photo of the owner is a strong trust and E-E-A-T signal for an owner-operated business. | `src/pages/why-duct-hunt.astro:50` | Open: add the photo. |
| P2-7 | `src/assets/dryer-ba-1.png` (720 KB) isn't used anywhere. It doesn't ship, but it's dead weight in the repo. | `src/assets/` | Open. |
| P2-8 | The homepage has two H2s starting "Get Your Free Quote" (the quick-quote bar and the bottom form). | `src/pages/index.astro:73,247` | Open (copy). |
| P2-9 | The service-area page lists 24 cities (`areaGroups`) while the homepage, Why page and FAQ list a different 12 (`homeCities`, still flagged as unconfirmed). Schema `areaServed` uses `areaGroups` + `areaCounties`. | `src/data/site.ts:119` | **Open.** Once Derek confirms the list, use one source. |

---

## Key diffs

**Soft 404 fix** (`src/pages/404.astro`, new):
```astro
<Base page="notfound" title="Page Not Found | Duct Hunt" description="…" noindex>
  <PhotoHero lead="Sorry, we can't find" accent="that page" narrow>…</PhotoHero>
  …links to services, area, reviews, FAQ…
</Base>
```
`Base.astro` drops the canonical and JSON-LD and adds `<meta name="robots" content="noindex">` when `noindex` is set.

**Real 301** (`public/_redirects`, new):
```
/services/duct-repair-sealing   /services/air-duct-cleaning/#light-duct-repair   301
/services/duct-repair-sealing/  /services/air-duct-cleaning/#light-duct-repair   301
```

**Connected entity graph** (`src/data/schema.ts`):
```diff
-const provider = { '@type': 'LocalBusiness', name: business.name };
-export const localBusiness = (extra = {}) => ({ '@type': 'LocalBusiness', name: …, address, … });
-export const service = (name, serviceType) => ({ '@type': 'Service', name, serviceType, provider, areaServed: ['Kansas City', 'North Kansas City'] });
+export const ids = { business: `${SITE}/#business`, website: `${SITE}/#website`, … };
+export const businessNode = (img) => ({ '@type': 'HVACBusiness', '@id': ids.business, url, logo, image, telephone,
+  address, geo, hasMap: business.googleCidUrl, sameAs: [business.googleCidUrl], areaServed, openingHoursSpecification, aggregateRating });
+export const serviceNode = (s) => ({ '@type': 'Service', '@id': ids.service(s), …, provider: { '@id': ids.business } });
```
Pages no longer build schema themselves. They pass `faqs={…}` and `pageServices={…}` to `Base`, which builds the whole graph.

**GBP anchoring** (`src/data/site.ts`): I followed `https://maps.app.goo.gl/PBD3ime9AN7Ch6dj8` to the place record. Its CID is `0xd07e34f6a63d6ef6`, which is `15023503640910196470` in decimal; the knowledge-graph ID is `/g/11f54t1rlf`; the pin is at `39.147813, -94.5762644`. These became `googleCidUrl` (used for `sameAs` and `hasMap`) and `geo`.

**Why `HVACBusiness`, and why not a separate Organization node:** schema.org has no duct-cleaning type. `HVACBusiness` (LocalBusiness → HomeAndConstructionBusiness → HVACBusiness) is the closest one Google accepts. Because a LocalBusiness is already an Organization, the single `#business` node carries the Organization fields (`logo`, `sameAs`, `url`). A second `Organization` node with its own `@id` would tell search engines there are two entities.

---

## Things I chose not to add

- **Review / per-review markup:** Google ignores star markup that a business publishes about itself on its own site (LocalBusiness/Organization "self-serving reviews"). The existing `aggregateRating` stays because it matches the visible badge, but it won't produce stars in search results.
- **Product schema:** there are no purchasable products.
- **HowTo:** the "process" steps are a sales outline, not instructions a visitor can follow.
- **JobPosting:** there's no careers page.
- **WebSite SearchAction:** the only search is the FAQ filter on `/faq/`, not a site search.
- **Street address and ZIP:** not in the repo or on the site. The business looks like a service-area business; publishing a street address that GBP hides would create a NAP mismatch.
- **FAQPage note:** since 2023 Google shows FAQ rich results only for well-known government and health sites. The markup is still valid and accurate (the script checks every question and answer appears word for word on the page), but don't expect FAQ snippets.

---

## What I could not verify (not marked as passing)

1. **Google Rich Results Test / Schema Markup Validator:** it can't be called from this environment. The script checks the graph's structure: one block per page, every `@id` reference resolves, FAQ text appears word for word, BreadcrumbList on every interior page. Google's required-property checks still need a manual run on each page.
2. **Live Business Profile data:** rating, review count, hours, categories and whether the address is hidden. Google Maps pages need JavaScript to render, so I only resolved the place ID and pin. See P1-9.
3. **Social and directory profiles** for `sameAs`. See P1-10.
4. **Core Web Vitals field data** (LCP, INP, CLS from CrUX or Search Console) and Lighthouse lab scores. The performance findings above come from reading the code only.
5. **Color contrast** wasn't measured. The palette uses white on `--blue` and `--blue-deep`, which looks fine, but run axe or Lighthouse.
6. ~~Whether Cloudflare keeps the `#fragment` in the `_redirects` target~~: confirmed after deploy (see below).
7. **Search Console:** indexing state, the old `sitemap-index.xml` submission, and any manual actions.

## Post-deploy checks (live, after commit `e6a5a08` deployed)

| Check | Result |
|---|---|
| `GET /this-page-does-not-exist` | **404** (was 200 + homepage) |
| `GET /services/duct-repair-sealing` and `…/` | **301** → `/services/air-duct-cleaning/#light-duct-repair`. Cloudflare keeps the fragment, which settles item 6 under "What I could not verify". |
| `GET /faq` | 308 → `/faq/` (Cloudflare's own slash handling; no custom slash rules) |
| `og:image` URL on `/` | 200 `image/jpeg` |
| Schema `logo` URL | 200 |
| `/` JSON-LD | `HVACBusiness` graph present |
| `robots.txt` | `Sitemap: https://www.ducthunt.com/sitemap.xml` |

## Running the audit

```sh
npm run build
npm run audit:seo   # node scripts/seo-audit.mjs; exits 1 on any error
```
The script checks every page for: lang and viewport; title and description length and uniqueness; canonical equals the www URL with trailing slash; OG and Twitter tags; no template leftovers; exactly one H1, no skipped levels, no duplicate H1s across pages; alt present and not a filename; width and height present; modern image format; no visible placeholder text; one JSON-LD `@graph` with HVACBusiness, WebSite and BreadcrumbList, and no unresolved `@id` references; FAQ text visible word for word; a skip link; a 404 page that is noindex; robots.txt and sitemap.xml agree with the page list.
