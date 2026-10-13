# Duct Hunt LLC website

Static Astro site for Duct Hunt LLC (air duct cleaning, dryer vent cleaning, and duct repair in Kansas City), built from the Claude Design prototype "Duct Hunt Home".

## Commands

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static files to dist/
npm run preview  # serves dist/
npm run check    # type-checks .astro and .ts files
```

`dist/` is plain HTML, CSS, JS and optimized images, so it can be hosted on Netlify, Vercel, Cloudflare Pages or any static host.

## Pages

| URL | Page |
| --- | --- |
| `/` | Home |
| `/services/` | Services overview |
| `/services/air-duct-cleaning/` | Air Duct Cleaning |
| `/services/dryer-vent-cleaning/` | Dryer Vent Cleaning |
| `/services/duct-repair-sealing/` | Redirects to the Light Duct Repair section of Air Duct Cleaning |
| `/why-duct-hunt/` | Why Duct Hunt |
| `/service-area/` | Service Area |
| `/faq/` | FAQ (search, one-open-per-category accordions, `#q-…` deep links) |
| `/quote/` | Free quote form. `?service=air-duct` or `dryer-vent` pre-selects the service. |
| `/reviews/` | All Google reviews |

## Where things live

- `src/data/site.ts`: phone, email, address, Google link, map embed, services, cities. Edit business facts here once and every page updates.
- `src/data/faqs.ts`, `src/data/reviews.ts`, `src/data/reviews.json`: page copy that changes most often.
- `src/data/schema.ts`: JSON-LD builders. FAQ schema is generated from the same FAQ data shown on the page, so the two always match.
- `src/layouts/Base.astro`: shared head/SEO tags, top bar, sticky header, CTA banner, footer and mobile call bar.
- `src/components/`: section building blocks (headings, buttons, review cards, steps, FAQ list, heroes, quote forms, before/after slider).
- `src/styles/global.css`: design tokens and shared classes. All colors are tokens at the top of the file (`--blue`, `--blue-deep`, `--blue-soft`, `--mist`, `--slate`, `--white`, `--sun`), Archivo for text, and Russo One for small labels only.

## Quote forms (Resend: not connected yet)

Every form submits through `src/scripts/quote.ts`, which:

1. pushes a `quote_request_submitted` event to `window.dataLayer` and dispatches a matching DOM event (for analytics/ads conversion tracking),
2. POSTs JSON to `PUBLIC_QUOTE_ENDPOINT`, if it is set.

To wire up Resend, create an endpoint (for example an Astro API route with a server adapter, or a Netlify/Vercel/Cloudflare function) that accepts the JSON below and sends the email with your Resend API key. Then set `PUBLIC_QUOTE_ENDPOINT` to its URL (see `.env.example`). Keep the Resend key server-side only.

Payload fields: `name`, `phone`, `email`, `service`, plus `ctype` (homepage forms) or `zip` (quote page), and `source` and `page`. A hidden `company` honeypot field is dropped before sending.

**Until the endpoint exists, visitors still see the thank-you message but nothing is delivered.** A warning is logged to the browser console.

## Before launch

These are placeholders carried over from the design, waiting on Derek:

- [ ] Connect the quote endpoint (above).
- [ ] Business hours: footer (`src/components/Footer.astro`).
- [ ] Guarantee terms: Why Duct Hunt page "All Work Guaranteed" band, and the FAQ answer "Is your work guaranteed?".
- [ ] FAQ answers marked `[to be confirmed]`: roof-exit dryer vents, trip fee (`src/data/faqs.ts`).
- [ ] City lists: homepage Service Area and Why Duct Hunt page show "Placeholder list. Confirm cities with Derek."
- [ ] Same-day quote timing note on `/quote/`.
- [ ] Photos still shown as labeled placeholders: Air Duct hero (Derek cleaning a supply vent), Duct Repair hero, Why Duct Hunt hero and Derek's portrait, Services "How Pricing Works" photo, and the two remaining Dryer Vent before/after pairs.
- [ ] The Dryer Vent gallery's first photo is a stopgap and may be an HVAC duct, not a dryer vent.
- [ ] Replace the plain "G" mark with the official Google logo if you have the asset.
- [ ] Confirm the 4.9 rating and 54-review count are current (`src/data/site.ts`).

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
