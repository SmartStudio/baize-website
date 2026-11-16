import { describe, expect, it } from 'vitest';
import { BAIDU_VERIFY_BODY, onRequest as onRequestOld } from './baidu_verify_codeva-eLOOfr2y8v.html';
import { BAIDU_VERIFY_BODY_Z21, onRequest as onRequestNew } from './baidu_verify_codeva-Z21HOcvAuD.html';

const oldUrl = 'https://fxai.ai/baidu_verify_codeva-eLOOfr2y8v.html';
const newUrl = 'https://fxai.ai/baidu_verify_codeva-Z21HOcvAuD.html';

function expectVerify(onRequest: typeof onRequestOld, url: string, body: string) {
  const res = onRequest({ request: new Request(url) });
  expect(res.status).toBe(200);
  expect(res.headers.get('location')).toBeNull();
  expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
  expect(res.headers.get('content-length')).toBe('32');
  return res.text().then((t) => {
    expect(t).toBe(body);
    expect(new TextEncoder().encode(t).length).toBe(32);
  });
}

describe('baidu verify eLOOfr2y8v', () => {
  it('returns the 32-byte code with 200 and no redirect', async () => {
    expect(BAIDU_VERIFY_BODY).toBe('eaca14306ddee526a88d5f19bc97afbd');
    await expectVerify(onRequestOld, oldUrl, BAIDU_VERIFY_BODY);
  });
  it('rejects other methods', () => {
    expect(onRequestOld({ request: new Request(oldUrl, { method: 'POST' }) }).status).toBe(405);
  });
});

describe('baidu verify Z21HOcvAuD', () => {
  it('returns the 32-byte code with 200 and no redirect', async () => {
    expect(BAIDU_VERIFY_BODY_Z21).toBe('2023fc444f09ce0dcb014d09b94d4091');
    await expectVerify(onRequestNew, newUrl, BAIDU_VERIFY_BODY_Z21);
  });
  it('rejects other methods', () => {
    expect(onRequestNew({ request: new Request(newUrl, { method: 'POST' }) }).status).toBe(405);
  });
});
