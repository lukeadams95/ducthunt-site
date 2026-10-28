/**
 * Cloudflare Pages Function: POST /send-lead-notification
 *
 * Emails each quote request to Duct Hunt through Resend. Runs alongside the
 * PUBLIC_QUOTE_ENDPOINT webhook (see src/scripts/quote.ts), not instead of it.
 *
 * Needs the RESEND_API_KEY and TURNSTILE_SECRET secrets (Cloudflare Pages →
 * Settings → Variables and Secrets; `.dev.vars` for `wrangler pages dev`).
 *
 * Every request must carry a Cloudflare Turnstile token in the
 * `cf-turnstile-response` field. It is checked with Siteverify (success, the
 * `quote` action, and a Duct Hunt hostname) before anything else runs. A
 * missing or failed check returns 403, and the browser then shows the visitor
 * the "please call" error instead of a false success, so a lead is never
 * silently dropped.
 */

interface Env {
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
}

interface Context {
  request: Request;
  env: Env;
}

const FROM = 'Duct Hunt <leads@newleadrelay.com>';
const TO = ['ducthuntllc@gmail.com'];

const TOKEN_FIELD = 'cf-turnstile-response';
const TURNSTILE_ACTION = 'quote';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Hostnames a token may come from: the live site and its Pages previews. */
export const isAllowedHostname = (h: unknown): boolean =>
  typeof h === 'string' &&
  (h === 'ducthunt.com' || h === 'www.ducthunt.com' || h === 'ducthunt-site.pages.dev' || h.endsWith('.ducthunt-site.pages.dev'));

/** Canonical Siteverify. Fails closed on any error. */
async function verifyTurnstile(token: unknown, secret: string | undefined, ip: string | null): Promise<boolean> {
  if (!secret) {
    console.error('[send-lead-notification] TURNSTILE_SECRET is not set');
    return false;
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
  try {
    const params = new URLSearchParams({ secret, response: token });
    if (ip) params.set('remoteip', ip);
    const r = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    const out = (await r.json()) as { success?: boolean; action?: string; hostname?: string; 'error-codes'?: string[] };
    if (out.success === true && out.action === TURNSTILE_ACTION && isAllowedHostname(out.hostname)) return true;
    console.warn('[send-lead-notification] Turnstile rejected', out['error-codes'] ?? [], out.action, out.hostname);
    return false;
  } catch (err) {
    console.error('[send-lead-notification] Siteverify request failed', err);
    return false;
  }
}

const MAX_FIELDS = 30;
const MAX_LEN = 2000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  message: 'Message',
  service: 'Service',
  ctype: 'Customer type',
  zip: 'ZIP',
  source: 'Form',
  page: 'Page',
};
const FIRST = ['name', 'email', 'phone', 'message'];

const label = (key: string) =>
  LABELS[key] ?? key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const isEmail = (s: string) => /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(s);

function buildHtml(f: Record<string, string>): string {
  const { name, email, phone } = f;
  const telHref = phone.replace(/[^\d+]/g, '');
  const link = 'color:#0b5cad;font-size:20px;font-weight:700;text-decoration:underline;display:inline-block;padding:6px 0;';

  const contact = [
    `<div style="font-size:24px;font-weight:800;color:#111;margin:0 0 8px;">${esc(name)}</div>`,
    email && isEmail(email) ? `<div><a href="mailto:${esc(email)}" style="${link}">${esc(email)}</a></div>` : '',
    phone && telHref ? `<div><a href="tel:${esc(telHref)}" style="${link}">${esc(phone)}</a></div>` : '',
  ].join('');

  const keys = [...FIRST, ...Object.keys(f).filter((k) => !FIRST.includes(k))].filter((k) => f[k]);
  const rows = keys
    .map(
      (k, i) => `<tr style="background:${i % 2 ? '#ffffff' : '#f5f7fa'};">
        <td style="padding:10px 14px;font-weight:700;color:#333;vertical-align:top;white-space:nowrap;border-bottom:1px solid #e3e7ec;">${esc(label(k))}</td>
        <td style="padding:10px 14px;color:#111;vertical-align:top;border-bottom:1px solid #e3e7ec;white-space:pre-wrap;word-break:break-word;">${esc(f[k])}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:16px;">
    <div style="background:#ffffff;border:3px solid #0b5cad;border-radius:12px;padding:20px 22px;margin:0 0 20px;">
      <div style="font-size:14px;font-weight:800;letter-spacing:0.12em;color:#0b5cad;margin:0 0 12px;">CONTACT THIS LEAD</div>
      ${contact}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#ffffff;border-radius:12px;overflow:hidden;font-size:16px;line-height:1.4;">
      ${rows}
    </table>
  </div>
</body></html>`;
}

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ ok: false, error: 'Expected a JSON object' }, 400);
  }

  // Turnstile first: nothing else runs (and nothing is emailed) without a valid token.
  const token = (body as Record<string, unknown>)[TOKEN_FIELD];
  delete (body as Record<string, unknown>)[TOKEN_FIELD];
  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET, request.headers.get('CF-Connecting-IP')))) {
    return json({ ok: false, error: 'Spam check failed' }, 403);
  }

  if (!env.RESEND_API_KEY) {
    console.error('[send-lead-notification] RESEND_API_KEY is not set');
    return json({ ok: false, error: 'Email is not configured' }, 500);
  }

  // Keep every field (pass-through), as trimmed strings with sane limits.
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>).slice(0, MAX_FIELDS)) {
    if (v === null || v === undefined || typeof v === 'object') continue;
    fields[k.slice(0, 60)] = String(v).trim().slice(0, MAX_LEN);
  }

  // Honeypot: bots fill the hidden "company" field. Accept and drop.
  if (fields.company) return json({ ok: true });
  delete fields.company;

  fields.name ??= '';
  fields.email ??= '';
  fields.phone ??= '';
  fields.message ??= '';
  if (!fields.name) return json({ ok: false, error: 'Name is required' }, 400);
  if (!fields.email && !fields.phone) return json({ ok: false, error: 'Email or phone is required' }, 400);

  const email: Record<string, unknown> = {
    from: FROM,
    to: TO,
    subject: `New Lead - ${fields.name.replace(/[\r\n]+/g, ' ')}`,
    html: buildHtml(fields),
  };
  if (isEmail(fields.email)) email.reply_to = fields.email;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    const out = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error('[send-lead-notification] Resend error', res.status, out);
      return json({ ok: false, error: out.message ?? `Resend returned ${res.status}` }, 502);
    }
    return json({ ok: true, id: out.id });
  } catch (err) {
    console.error('[send-lead-notification] Resend request failed', err);
    return json({ ok: false, error: 'Could not reach the email service' }, 502);
  }
};
