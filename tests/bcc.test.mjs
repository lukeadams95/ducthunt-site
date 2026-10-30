/** Agency BCC rides on the single Resend call; nothing about it reaches the browser. */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestPost } from '../functions/send-lead-notification.ts';

const ENV = { RESEND_API_KEY: 're_test_stub', TURNSTILE_SECRET: 'ts_test_stub' };
const req = () =>
  new Request('https://www.ducthunt.com/send-lead-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://www.ducthunt.com' },
    body: JSON.stringify({ name: 'Test User', phone: '8165550100', 'cf-turnstile-response': 'tok' }),
  });
function stub(status, body) {
  const calls = [];
  globalThis.fetch = async (u, init) => {
    if (String(u).includes('siteverify'))
      return new Response(JSON.stringify({ success: true, action: 'quote', hostname: 'www.ducthunt.com' }));
    if (String(u) !== 'https://api.resend.com/emails') throw new Error(`blocked live request: ${u}`);
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify(body), { status });
  };
  return calls;
}
afterEach(() => delete globalThis.fetch);

test('one Resend call: To is Derek only, agency in bcc, sender and subject unchanged', async () => {
  const calls = stub(200, { id: 'stub' });
  const res = await onRequestPost({ request: req(), env: ENV });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].to, ['ducthuntllc@gmail.com']);
  assert.deepEqual(calls[0].bcc, ['luke@blueheronmarketing.com']);
  assert.equal(calls[0].cc, undefined);
  assert.equal(calls[0].from, 'Duct Hunt <leads@newleadrelay.com>');
  assert.equal(calls[0].subject, 'New Lead - Test User');
  assert.doesNotMatch(await res.text(), /blueheron|gmail/i);
});

test('a Resend error message is not echoed to the browser', async () => {
  stub(422, { message: 'Invalid `bcc` field luke@blueheronmarketing.com' });
  const res = await onRequestPost({ request: req(), env: ENV });
  assert.equal(res.status, 502);
  assert.doesNotMatch(await res.text(), /blueheron|bcc/i);
});
