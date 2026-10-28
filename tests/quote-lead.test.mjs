/**
 * Lead tracking tests. fetch is fully stubbed: nothing here can reach Resend,
 * the live site, or a real webhook.
 */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { sendQuote } from '../src/scripts/quote.ts';

const NOTIFY = '/send-lead-notification';

let gtagCalls;
let dataLayer;
let fetchCalls;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installBrowser(pathname) {
  gtagCalls = [];
  dataLayer = [];
  globalThis.location = { pathname };
  globalThis.window = {
    dataLayer,
    gtag: (...args) => {
      gtagCalls.push(args);
    },
    dispatchEvent() {},
  };
}

function stubFetch(handler) {
  fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (target.includes('api.resend.com') || target.includes('ducthunt.com')) {
      throw new Error(`blocked live request: ${target}`);
    }
    fetchCalls.push({ url: target, init });
    return handler(target, init);
  };
}

function leadBody(formName) {
  return {
    name: 'Test User',
    phone: '8165550100',
    email: 'test@example.com',
    service: 'Air Duct Cleaning',
    source: formName,
  };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

describe('generate_lead', { concurrency: false }, () => {
  let warn;
  let error;

  beforeEach(() => {
    warn = console.warn;
    error = console.error;
    console.warn = () => {};
    console.error = () => {};
  });

  afterEach(() => {
    console.warn = warn;
    console.error = error;
    delete globalThis.fetch;
    delete globalThis.window;
    delete globalThis.location;
  });

  test('fires once after the lead notification succeeds', async () => {
    installBrowser('/quote/');
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    stubFetch((url) => {
      assert.equal(url, NOTIFY);
      return gate.then(() => jsonResponse({ ok: true, id: 'email_stub' }));
    });

    const pending = sendQuote(leadBody('quote-page'), 'quote-page');
    await settle();
    assert.equal(gtagCalls.length, 0, 'must not fire before the API returns');

    release();
    await pending;
    await settle();

    assert.equal(gtagCalls.length, 1);
    assert.deepEqual(gtagCalls[0], [
      'event',
      'generate_lead',
      { form_name: 'quote-page', page_path: '/quote/' },
    ]);
    assert.equal(fetchCalls.length, 1);
    const sent = JSON.parse(fetchCalls[0].init.body);
    assert.equal(sent.source, 'quote-page');
    assert.equal(sent.page, '/quote/');
    assert.equal(sent.company, undefined);
  });

  test('covers every lead form id', async () => {
    const forms = [
      ['quote-page', '/quote/'],
      ['home-quick', '/'],
      ['home-form', '/'],
    ];
    for (const [formName, page] of forms) {
      installBrowser(page);
      stubFetch(() => jsonResponse({ ok: true, id: 'email_stub' }));
      await sendQuote(leadBody(formName), formName);
      await settle();
      assert.equal(gtagCalls.length, 1, formName);
      assert.deepEqual(gtagCalls[0][2], { form_name: formName, page_path: page });
    }
  });

  test('does not fire when the notification fails', async () => {
    installBrowser('/quote/');
    stubFetch(() => jsonResponse({ ok: false, error: 'stubbed failure' }, 502));

    await assert.rejects(sendQuote(leadBody('quote-page'), 'quote-page'), /Lead notification failed/);
    await settle();

    assert.equal(gtagCalls.length, 0);
    assert.equal(fetchCalls.length, 1);
  });

  test('does not fire when the notification cannot be reached', async () => {
    installBrowser('/');
    stubFetch(() => {
      throw new Error('offline');
    });

    await assert.rejects(sendQuote(leadBody('home-quick'), 'home-quick'), /Lead notification failed/);
    await settle();

    assert.equal(gtagCalls.length, 0);
  });

  test('does not fire when the notification body reports failure', async () => {
    installBrowser('/');
    stubFetch(() => jsonResponse({ ok: false, error: 'Email is not configured' }, 200));

    await assert.rejects(sendQuote(leadBody('home-form'), 'home-form'), /Lead notification failed/);
    await settle();

    assert.equal(gtagCalls.length, 0);
  });

  test('does not fire for a honeypot submission', async () => {
    installBrowser('/quote/');
    stubFetch(() => {
      throw new Error('honeypot must not send');
    });

    await sendQuote({ ...leadBody('quote-page'), company: 'Acme Bots' }, 'quote-page');
    await settle();

    assert.equal(gtagCalls.length, 0);
    assert.equal(fetchCalls.length, 0);
  });

  test('webhook failure is still a failed submission and does not fire', async () => {
    installBrowser('/quote/');
    stubFetch((url) => {
      if (url === NOTIFY) return jsonResponse({ ok: true, id: 'email_stub' });
      return jsonResponse({ ok: false }, 500);
    });

    await assert.rejects(
      sendQuote(leadBody('quote-page'), 'quote-page', 'https://example.test/webhook'),
      /Quote request failed: 500/,
    );
    await settle();

    assert.equal(gtagCalls.length, 0);
    assert.ok(fetchCalls.some((call) => call.url === NOTIFY));
    assert.ok(fetchCalls.some((call) => call.url === 'https://example.test/webhook'));
  });

  test('fires once when both the webhook and the notification succeed', async () => {
    installBrowser('/quote/');
    stubFetch((url) => {
      if (url === NOTIFY) return jsonResponse({ ok: true, id: 'email_stub' });
      return jsonResponse({ ok: true });
    });

    await sendQuote(leadBody('quote-page'), 'quote-page', 'https://example.test/webhook');
    await settle();

    assert.equal(gtagCalls.length, 1);
    assert.equal(gtagCalls[0][2].form_name, 'quote-page');
  });

  test('does not fire when the webhook succeeds but the notification fails', async () => {
    installBrowser('/quote/');
    stubFetch((url) => {
      if (url === NOTIFY) return jsonResponse({ message: 'no' }, 502);
      return jsonResponse({ ok: true });
    });

    await sendQuote(leadBody('quote-page'), 'quote-page', 'https://example.test/webhook');
    await settle();

    assert.equal(gtagCalls.length, 0);
  });

  test('a Turnstile rejection (403) is a visible failure, not a silent drop', async () => {
    installBrowser('/quote/');
    stubFetch(() => jsonResponse({ ok: false, error: 'Spam check failed' }, 403));

    await assert.rejects(sendQuote(leadBody('quote-page'), 'quote-page'), /Lead notification failed/);
    await settle();

    assert.equal(gtagCalls.length, 0);
  });

  test('the Turnstile token goes to the notification only, never the webhook', async () => {
    installBrowser('/quote/');
    stubFetch((url) => (url === NOTIFY ? jsonResponse({ ok: true, id: 'email_stub' }) : jsonResponse({ ok: true })));

    await sendQuote({ ...leadBody('quote-page'), 'cf-turnstile-response': 'tok_stub' }, 'quote-page', 'https://example.test/webhook');
    await settle();

    const notify = JSON.parse(fetchCalls.find((c) => c.url === NOTIFY).init.body);
    const hook = JSON.parse(fetchCalls.find((c) => c.url !== NOTIFY).init.body);
    assert.equal(notify['cf-turnstile-response'], 'tok_stub');
    assert.equal(hook['cf-turnstile-response'], undefined);
  });

  test('a second successful submission fires a second event', async () => {
    installBrowser('/');
    stubFetch(() => jsonResponse({ ok: true, id: 'email_stub' }));

    await sendQuote(leadBody('home-form'), 'home-form');
    await sendQuote(leadBody('home-form'), 'home-form');
    await settle();

    assert.equal(gtagCalls.length, 2);
  });
});
