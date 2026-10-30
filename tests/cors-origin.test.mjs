/**
 * CORS and Origin allowlist for the lead endpoint. No network: fetch throws,
 * so a refused origin must be rejected before Turnstile or Resend is reached.
 */
import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { onRequestOptions, onRequestPost, isAllowedOrigin } from '../functions/send-lead-notification.ts';

const preflight = (origin) =>
  new Request('https://www.ducthunt.com/send-lead-notification', {
    method: 'OPTIONS',
    headers: origin ? { Origin: origin, 'Access-Control-Request-Method': 'POST' } : {},
  });

describe('origin allowlist', () => {
  afterEach(() => {
    delete globalThis.fetch;
  });

  for (const o of ['https://www.ducthunt.com', 'https://ducthunt.com', 'https://ducthunt-site.pages.dev', 'https://abc123.ducthunt-site.pages.dev']) {
    test(`preflight allowed for ${o} with exact ACAO`, () => {
      const res = onRequestOptions({ request: preflight(o) });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('Access-Control-Allow-Origin'), o);
      assert.equal(res.headers.get('Vary'), 'Origin');
    });
  }

  for (const o of ['https://evil.example.com', 'http://www.ducthunt.com', 'https://www.ducthunt.com.evil.com', 'https://notducthunt.com', 'https://www.ducthunt.com:8443', 'null', null]) {
    test(`preflight refused for ${o}`, () => {
      const res = onRequestOptions({ request: preflight(o) });
      assert.equal(res.status, 403);
      assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
    });
  }

  test('POST from a foreign origin is refused before any network call', async () => {
    globalThis.fetch = async (u) => {
      throw new Error(`blocked live request: ${u}`);
    };
    const res = await onRequestPost({
      request: new Request('https://www.ducthunt.com/send-lead-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example.com' },
        body: JSON.stringify({ name: 'X Y', phone: '8165550100', 'cf-turnstile-response': 'tok' }),
      }),
      env: { RESEND_API_KEY: 're_test_stub', TURNSTILE_SECRET: 'ts_test_stub' },
    });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
  });

  test('POST from the site echoes its origin', async () => {
    globalThis.fetch = async (u) => {
      if (String(u).includes('siteverify'))
        return new Response(JSON.stringify({ success: true, action: 'quote', hostname: 'www.ducthunt.com' }));
      if (String(u) === 'https://api.resend.com/emails') return new Response(JSON.stringify({ id: 'stub' }));
      throw new Error(`blocked live request: ${u}`);
    };
    const res = await onRequestPost({
      request: new Request('https://www.ducthunt.com/send-lead-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://www.ducthunt.com' },
        body: JSON.stringify({ name: 'X Y', phone: '8165550100', 'cf-turnstile-response': 'tok' }),
      }),
      env: { RESEND_API_KEY: 're_test_stub', TURNSTILE_SECRET: 'ts_test_stub' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://www.ducthunt.com');
  });

  test('isAllowedOrigin rejects junk', () => {
    assert.equal(isAllowedOrigin('not a url'), false);
    assert.equal(isAllowedOrigin(''), false);
  });
});
