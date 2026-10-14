/**
 * Shared quote submission. Every form on the site posts through here.
 *
 * Each submission does two independent things in parallel:
 * 1. POSTs to PUBLIC_QUOTE_ENDPOINT (the webhook), if it is set. A failure here
 *    shows the visitor an error, as before.
 * 2. POSTs to /send-lead-notification (Cloudflare Pages Function that emails
 *    the lead via Resend). Failures are only logged and never affect the visitor.
 */
const endpoint = import.meta.env.PUBLIC_QUOTE_ENDPOINT as string | undefined;
const notifyEndpoint = '/send-lead-notification';

/** Fire-and-forget email notification. Never throws, never blocks. */
function notifyByEmail(payload: Record<string, string>): void {
  fetch(notifyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .then(async (res) => {
      if (!res.ok) console.error('[quote] Email notification failed:', res.status, await res.text().catch(() => ''));
    })
    .catch((err) => console.error('[quote] Email notification failed:', err));
}

export type QuotePayload = Record<string, string>;

declare global {
  interface Window { dataLayer?: unknown[] }
}

export async function sendQuote(data: QuotePayload, source: string): Promise<void> {
  // Honeypot: bots fill every field. Pretend success and drop it.
  if (data.company) return;
  delete data.company;

  const payload = { ...data, source, page: location.pathname };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'quote_request_submitted', service: data.service ?? '', customer_type: data.ctype ?? '', source });
    window.dispatchEvent(new CustomEvent('quote_request_submitted', { detail: payload }));
  } catch {
    /* analytics must never block the lead */
  }

  // Started before (and not awaited by) the webhook below, so neither blocks the other.
  notifyByEmail(payload);

  if (!endpoint) {
    console.warn('[quote] PUBLIC_QUOTE_ENDPOINT is not set, so this request was not sent.', payload);
    return;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Quote request failed: ${res.status}`);
}

export const formData = (form: HTMLFormElement): QuotePayload =>
  Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
