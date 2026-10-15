# Duct Hunt LLC website

Static Astro site for Duct Hunt LLC (air duct cleaning, dryer vent cleaning, and duct repair in Kansas City), built from the Claude Design prototype "Duct Hunt Home".

## Commands

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static files to dist/
npm run preview  # serves dist/
npm run check    # type-checks .astro and .ts files
npm run audit:seo  # after a build: SEO checks over every page in dist/ (see seo-audit.md)
```

`dist/` is plain HTML, CSS, JS and optimized images, so it can be hosted on Netlify, Vercel, Cloudflare Pages or any static host.

## Pages

| URL | Page |
| --- | --- |
| `/` | Home |
| `/services/` | Services overview |
| `/services/air-duct-cleaning/` | Air Duct Cleaning |
| `/services/dryer-vent-cleaning/` | Dryer Vent Cleaning |
| `/services/duct-repair-sealing/` | 301 to the Light Duct Repair section of Air Duct Cleaning (`public/_redirects`) |
| `/why-duct-hunt/` | Why Duct Hunt |
| `/service-area/` | Service Area |
| `/faq/` | FAQ (search, one-open-per-category accordions, `#q-…` deep links) |
| `/quote/` | Free quote form. `?service=air-duct` or `dryer-vent` pre-selects the service. |
| `/reviews/` | All Google reviews |
| `/404.html` | Not-found page; Cloudflare Pages serves it with a 404 status for unknown URLs |

## Where things live

- `src/data/site.ts`: phone, email, address, Google link, map embed, services, cities. Edit business facts here once and every page updates.
- `src/data/faqs.ts`, `src/data/reviews.ts`, `src/data/reviews.json`: page copy that changes most often.
- `src/data/schema.ts`: JSON-LD builders. `Base.astro` emits one connected `@graph` per page (business, website, page, breadcrumbs, services, FAQ). FAQ schema is generated from the same FAQ data shown on the page, so the two always match. Never put placeholder text in `faqs.ts`.
- `src/layouts/Base.astro`: shared head/SEO tags, top bar, sticky header, CTA banner, footer and mobile call bar.
- `src/components/`: section building blocks (headings, buttons, review cards, steps, FAQ list, heroes, quote forms, before/after slider).
- `src/styles/global.css`: design tokens and shared classes. All colors are tokens at the top of the file (`--blue`, `--blue-deep`, `--blue-soft`, `--mist`, `--slate`, `--white`, `--sun`), Archivo for text, and Russo One for small labels only.

## Quote forms

Every form submits through `src/scripts/quote.ts`, which:

1. pushes a `quote_request_submitted` event to `window.dataLayer` and dispatches a matching DOM event (for analytics/ads conversion tracking),
2. POSTs JSON to `/send-lead-notification` (email notification, below),
3. POSTs JSON to `PUBLIC_QUOTE_ENDPOINT` (webhook), if it is set.

Steps 2 and 3 run in parallel. A webhook failure shows the visitor an error; an email failure is only logged to the console and never affects the visitor.

After the notification returns success — and only then — the same submit fires GA4 `gtag('event', 'generate_lead', { form_name, page_path })` once. `form_name` is the form id passed as `source` (`quote-page` on `/quote/`, `home-quick` and `home-form` on `/`). `page_path` is the current path. A failed notification, a failed webhook, or a honeypot does not fire it. There is no thank-you URL; the inline confirmation is not replayed on refresh. The GA4 tag `G-J47KQV5GP8` is already in `src/layouts/Base.astro`.

Payload fields: `name`, `phone`, `email`, `service`, plus `ctype` (homepage forms) or `zip` (quote page), and `source` and `page`. A hidden `company` honeypot field is dropped before sending.

If `PUBLIC_QUOTE_ENDPOINT` is unset, the webhook is skipped and a warning is logged (see `.env.example`).

### Email notification (Resend)

`functions/send-lead-notification.ts` is a Cloudflare Pages Function served at `/send-lead-notification`. It emails each lead from `Duct Hunt <leads@newleadrelay.com>` to `ducthuntllc@gmail.com` with Reply-To set to the lead's email, a "Contact this lead" block (tap-to-email / tap-to-call), and a table of every submitted field.

- **Secret:** set `RESEND_API_KEY` in Cloudflare (**Workers & Pages → ducthunt-site → Settings → Variables and Secrets**, type *Secret*, Production and Preview), then redeploy. For local testing with `npx wrangler pages dev dist`, put it in `.dev.vars` (git-ignored).
- **Sender domain:** `newleadrelay.com` must be verified in the Resend account that owns the key, or Resend rejects the send.
- `npm run dev` (Astro only) does not run Pages Functions, so the email call 404s there; that is expected and only logged.

## Before launch

These are placeholders carried over from the design, waiting on Derek:

- [ ] Set `RESEND_API_KEY` in Cloudflare and send a test lead (above).
- [ ] Business hours: footer (`src/components/Footer.astro`).
- [ ] Guarantee terms: Why Duct Hunt page "All Work Guaranteed" band, and the FAQ answer "Is your work guaranteed?" (currently the general "we'll make it right" line; the public placeholder note was removed).
- [ ] FAQ answers for roof-exit dryer vents and trip fee currently say "call and we'll confirm" (`src/data/faqs.ts`); replace with real answers.
- [ ] City lists: homepage Service Area and Why Duct Hunt page still use the unconfirmed placeholder list in `src/data/site.ts` (`homeCities`). The public note was removed; confirm cities with Derek.
- [ ] Same-day quote timing on `/quote/` ("usually the same day" step); the public placeholder note was removed.
- [ ] Derek's portrait on Why Duct Hunt (the placeholder box was removed; the section is text-only until a photo exists). The Services "How Pricing Works" placeholder now uses the truck/trailer photo.
- [ ] The Dryer Vent gallery's first photo is a stopgap and may be an HVAC duct, not a dryer vent.
- [ ] Replace the plain "G" mark with the official Google logo if you have the asset.
- [ ] Confirm the 4.9 rating, 54-review count and hours against the Google Business Profile (`src/data/site.ts`); they feed the schema.
- [ ] Add real social/directory profile URLs to `sameAs` in `src/data/schema.ts`.

## Deploying to Cloudflare Pages

Connect this repository in **Workers & Pages → Create → Pages → Connect to Git** with:

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Root directory | *(leave blank)* |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

Every push to `main` redeploys; other branches get preview URLs.
