/**
 * Exercises the Pages Function with Resend stubbed. global fetch refuses every
 * host except the stub, so a regression cannot send a real email.
 */
import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { onRequestPost } from '../functions/send-lead-notification.ts';

const RESEND = 'https://api.resend.com/emails';

function leadRequest(fields) {
  return new Request('https://www.ducthunt.com/send-lead-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

describe('send-lead-notification', { concurrency: false }, () => {
  let calls;

  afterEach(() => {
    delete globalThis.fetch;
  });

  function stubResend(status, body) {
    calls = [];
    globalThis.fetch = async (url, init) => {
      const target = String(url);
      if (target !== RESEND) throw new Error(`blocked live request: ${target}`);
      calls.push({ url: target, init });
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    };
  }

  test('success returns ok and posts a New Lead email to the stub only', async () => {
    stubResend(200, { id: 'email_stub_123' });

    const res = await onRequestPost({
      request: leadRequest({
        name: 'Test User',
        email: 'test@example.com',
        phone: '8165550100',
        service: 'Air Duct Cleaning',
        source: 'quote-page',
        page: '/quote/',
      }),
      env: { RESEND_API_KEY: 're_test_stub' },
    });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, id: 'email_stub_123' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, RESEND);
    const sent = JSON.parse(calls[0].init.body);
    assert.match(sent.subject, /^New Lead - Test User$/);
    assert.equal(sent.reply_to, 'test@example.com');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test_stub');
  });

  test('a stubbed Resend failure is a failed submission', async () => {
    stubResend(422, { message: 'stubbed rejection' });

    const res = await onRequestPost({
      request: leadRequest({ name: 'Test User', phone: '8165550100', source: 'home-quick' }),
      env: { RESEND_API_KEY: 're_test_stub' },
    });

    assert.equal(res.status, 502);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(calls.length, 1);
  });

  test('invalid leads never call Resend', async () => {
    stubResend(200, { id: 'should-not-send' });

    const res = await onRequestPost({
      request: leadRequest({ email: 'test@example.com' }),
      env: { RESEND_API_KEY: 're_test_stub' },
    });

    assert.equal(res.status, 400);
    assert.equal(calls.length, 0);
  });

  test('honeypot leads never call Resend', async () => {
    stubResend(200, { id: 'should-not-send' });

    const res = await onRequestPost({
      request: leadRequest({ name: 'Bot', email: 'bot@example.com', company: 'spam' }),
      env: { RESEND_API_KEY: 're_test_stub' },
    });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(calls.length, 0);
  });
});
