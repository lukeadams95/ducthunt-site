/**
 * Exercises the Pages Function with Resend stubbed. global fetch refuses every
 * host except the stub, so a regression cannot send a real email.
 */
import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { onRequestPost } from '../functions/send-lead-notification.ts';

const RESEND = 'https://api.resend.com/emails';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const ENV = { RESEND_API_KEY: 're_test_stub', TURNSTILE_SECRET: 'ts_test_stub' };
const GOOD = { success: true, action: 'quote', hostname: 'www.ducthunt.com' };

function leadRequest(fields, token = 'tok_stub') {
  return new Request('https://www.ducthunt.com/send-lead-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7' },
    body: JSON.stringify(token === null ? fields : { ...fields, 'cf-turnstile-response': token }),
  });
}

describe('send-lead-notification', { concurrency: false }, () => {
  let calls;

  afterEach(() => {
    delete globalThis.fetch;
  });

  let verifies;

  function stubResend(status, body, verify = GOOD) {
    calls = [];
    verifies = [];
    globalThis.fetch = async (url, init) => {
      const target = String(url);
      if (target === SITEVERIFY) {
        verifies.push(init);
        if (verify instanceof Error) throw verify;
        return new Response(JSON.stringify(verify), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
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
      env: ENV,
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
      env: ENV,
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
      env: ENV,
    });

    assert.equal(res.status, 400);
    assert.equal(calls.length, 0);
  });

  test('honeypot leads never call Resend', async () => {
    stubResend(200, { id: 'should-not-send' });

    const res = await onRequestPost({
      request: leadRequest({ name: 'Bot', email: 'bot@example.com', company: 'spam' }),
      env: ENV,
    });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(calls.length, 0);
  });

  test('the token is checked once and never lands in the email', async () => {
    stubResend(200, { id: 'email_stub_123' });
    const res = await onRequestPost({ request: leadRequest({ name: 'Test User', phone: '8165550100' }), env: ENV });
    assert.equal(res.status, 200);
    assert.equal(verifies.length, 1);
    const form = new URLSearchParams(verifies[0].body);
    assert.equal(form.get('response'), 'tok_stub');
    assert.equal(form.get('remoteip'), '203.0.113.7');
    assert.doesNotMatch(JSON.parse(calls[0].init.body).html, /tok_stub|turnstile/i);
  });

  for (const [name, token, verify] of [
    ['missing token', null, GOOD],
    ['empty token', '', GOOD],
    ['siteverify says no', 'tok_stub', { success: false, 'error-codes': ['invalid-input-response'] }],
    ['wrong action', 'tok_stub', { ...GOOD, action: 'signup' }],
    ['another site\'s hostname', 'tok_stub', { ...GOOD, hostname: 'www.guycoatings.com' }],
    ['siteverify unreachable', 'tok_stub', new Error('offline')],
  ]) {
    test(`403 and no email: ${name}`, async () => {
      stubResend(200, { id: 'should-not-send' }, verify);
      const res = await onRequestPost({ request: leadRequest({ name: 'Test User', phone: '8165550100' }, token), env: ENV });
      assert.equal(res.status, 403);
      assert.equal((await res.json()).ok, false);
      assert.equal(calls.length, 0);
    });
  }

  test('403 and no email when TURNSTILE_SECRET is missing', async () => {
    stubResend(200, { id: 'should-not-send' });
    const res = await onRequestPost({
      request: leadRequest({ name: 'Test User', phone: '8165550100' }),
      env: { RESEND_API_KEY: 're_test_stub' },
    });
    assert.equal(res.status, 403);
    assert.equal(verifies.length, 0);
    assert.equal(calls.length, 0);
  });

  test('Pages preview hostnames are accepted', async () => {
    stubResend(200, { id: 'email_stub_123' }, { ...GOOD, hostname: 'abc123.ducthunt-site.pages.dev' });
    const res = await onRequestPost({ request: leadRequest({ name: 'Test User', phone: '8165550100' }), env: ENV });
    assert.equal(res.status, 200);
  });
});
