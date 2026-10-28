/**
 * Cloudflare Turnstile for the quote forms (managed, interaction-only).
 *
 * api.js loads on the visitor's first interaction with a form, so it adds no
 * work to page load. Each form gets its own explicitly rendered widget. Most
 * visitors never see it; the challenge only appears when Cloudflare needs a
 * click. Tokens are single-use, so a widget is reset after every attempt.
 * The token is checked server-side in functions/send-lead-notification.ts.
 */
export const TURNSTILE_SITEKEY = '0x4AAAAAAFBOLbH9nLEHWGVh';
export const TURNSTILE_ACTION = 'quote';
export const TOKEN_FIELD = 'cf-turnstile-response';

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string | undefined;
  reset(id: string): void;
  getResponse(id: string): string | undefined;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __dhTurnstileReady?: () => void;
  }
}

let loading: Promise<TurnstileApi | null> | null = null;

function loadApi(): Promise<TurnstileApi | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(window.turnstile ?? null), 15_000);
    window.__dhTurnstileReady = () => {
      window.clearTimeout(timer);
      resolve(window.turnstile ?? null);
    };
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__dhTurnstileReady';
    s.async = true;
    s.onerror = () => {
      window.clearTimeout(timer);
      loading = null; // allow a retry on the next attempt
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return loading;
}

export interface FormGuard {
  /** Resolves with a fresh token, or '' if Turnstile could not produce one. */
  token(): Promise<string>;
  /** Call after every submit attempt (tokens are single-use). */
  reset(): void;
}

/** Wire one Turnstile widget into `box`, rendered lazily on first use of `form`. */
export function guardForm(form: HTMLElement, box: HTMLElement): FormGuard {
  let id: string | undefined;
  let current = '';
  let waiters: Array<(t: string) => void> = [];
  let started: Promise<void> | null = null;

  const settle = (t: string) => {
    current = t;
    if (t) {
      waiters.forEach((w) => w(t));
      waiters = [];
    }
  };

  const start = () =>
    (started ??= loadApi().then((api) => {
      if (!api) {
        started = null;
        return;
      }
      try {
        id = api.render(box, {
          sitekey: TURNSTILE_SITEKEY,
          action: TURNSTILE_ACTION,
          appearance: 'interaction-only',
          size: 'flexible',
          'response-field': false,
          'refresh-expired': 'auto',
          callback: (t: string) => settle(t),
          'expired-callback': () => settle(''),
          'error-callback': () => settle(''), // Turnstile retries on its own (retry: auto)
        });
      } catch (err) {
        console.error('[turnstile] render failed', err);
        started = null;
      }
    }));

  const kick = () => void start();
  ['focusin', 'pointerdown', 'touchstart'].forEach((ev) => form.addEventListener(ev, kick, { once: true, passive: true }));

  return {
    async token() {
      await start();
      if (current) return current;
      if (!id) return '';
      // Wait for the widget (it may need a click). Give up after 60s; the
      // server then rejects and the visitor sees the "please call" message.
      return new Promise<string>((resolve) => {
        const t = window.setTimeout(() => {
          waiters = waiters.filter((w) => w !== done);
          resolve('');
        }, 60_000);
        const done = (tok: string) => {
          window.clearTimeout(t);
          resolve(tok);
        };
        waiters.push(done);
      });
    },
    reset() {
      current = '';
      if (id && window.turnstile) {
        try {
          window.turnstile.reset(id);
        } catch {
          /* widget gone; next start() renders again */
        }
      }
    },
  };
}
