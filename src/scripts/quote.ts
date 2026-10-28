/**
 * Shared quote submission. Every form on the site posts through here.
 *
 * Each submission does two independent things in parallel:
 * 1. POSTs to PUBLIC_QUOTE_ENDPOINT (the webhook), if it is set. A failure here
 *    shows the visitor an error, as before.
 * 2. POSTs to /send-lead-notification (Cloudflare Pages Function that emails
 *    the lead via Resend, after a Turnstile check). When no webhook is set this
 *    email is the only lead path, so its failure is a failed submission: the
 *    visitor sees the "please call" error instead of a false success. When a
 *    webhook is set, a notification failure is only logged, as before.
 *
 * GA4 `generate_lead` fires once per submission, only after that notification
 * returns success. It does not fire for honeypots, notification failures, or
 * webhook failures. There is no thank-you URL, so this is not deferred to a
 * later page (a refresh shows the form again and does not replay the event).
 */
const notifyEndpoint = '/send-lead-notification';

function quoteEndpoint(): string | undefined {
  try {
    const value = import.meta.env.PUBLIC_QUOTE_ENDPOINT as string | undefined;
    return value || undefined;
  } catch {
    return undefined;
  }
}

/** Fire-and-forget email notification. Never throws, never blocks the visitor. */
async function notifyByEmail(payload: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch(notifyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!res.ok) {
      console.error('[quote] Email notification failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
    if (body.ok === false) {
      console.error('[quote] Email notification failed:', body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[quote] Email notification failed:', err);
    return false;
  }
}

function trackGenerateLead(formName: string, pagePath: string): void {
  try {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      // Same queue the GA4 snippet installs, so a late gtag.js still sees the hit.
      window.gtag = function gtag() {
        window.dataLayer!.push(arguments);
      };
    }
    window.gtag('event', 'generate_lead', { form_name: formName, page_path: pagePath });
  } catch {
    /* analytics must never block the lead */
  }
}

export type QuotePayload = Record<string, string>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const TOKEN_FIELD = 'cf-turnstile-response';

export async function sendQuote(data: QuotePayload, source: string, endpoint = quoteEndpoint()): Promise<void> {
  // Honeypot: bots fill every field. Pretend success and drop it.
  if (data.company) return;
  delete data.company;

  // The Turnstile token goes only to our own notification endpoint.
  const token = data[TOKEN_FIELD];
  delete data[TOKEN_FIELD];
  const payload = { ...data, source, page: location.pathname };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'quote_request_submitted', service: data.service ?? '', customer_type: data.ctype ?? '', source });
    window.dispatchEvent(new CustomEvent('quote_request_submitted', { detail: payload }));
  } catch {
    /* analytics must never block the lead */
  }

  const notified = notifyByEmail(token ? { ...payload, [TOKEN_FIELD]: token } : payload);
  // Arm only on the visitor-success path. A webhook failure throws below and
  // never reaches this, so a notification that already succeeded cannot emit.
  let armed = false;
  const trackAfterNotification = () => {
    if (armed) return;
    armed = true;
    void notified.then((ok) => {
      if (ok) trackGenerateLead(source, payload.page);
    });
  };

  if (!endpoint) {
    // The email is the only lead path: wait for it and surface a failure.
    trackAfterNotification();
    if (!(await notified)) throw new Error('Lead notification failed');
    return;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Quote request failed: ${res.status}`);
  trackAfterNotification();
}

export const formData = (form: HTMLFormElement): QuotePayload =>
  Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
