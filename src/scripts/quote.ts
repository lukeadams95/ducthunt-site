/**
 * Shared quote submission. Every form on the site posts through here.
 *
 * Set PUBLIC_QUOTE_ENDPOINT to the URL of the (future) Resend-backed endpoint.
 * Until then, requests are NOT delivered anywhere; the visitor still sees the
 * thank-you state, so do not launch without it.
 */
const endpoint = import.meta.env.PUBLIC_QUOTE_ENDPOINT as string | undefined;

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
