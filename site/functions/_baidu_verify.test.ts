import { describe, expect, it } from 'vitest';
import { BAIDU_VERIFY_BODY, onRequest } from './baidu_verify_codeva-eLOOfr2y8v.html';

const url = 'https://fxai.ai/baidu_verify_codeva-eLOOfr2y8v.html';

describe('baidu verify function', () => {
  it('returns the 32-byte code with 200 and no redirect', async () => {
    const res = onRequest({ request: new Request(url) });
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    const body = await res.text();
    expect(body).toBe('eaca14306ddee526a88d5f19bc97afbd');
    expect(new TextEncoder().encode(body).length).toBe(32);
    expect(BAIDU_VERIFY_BODY).toBe(body);
  });
  it('rejects other methods', () => {
    expect(onRequest({ request: new Request(url, { method: 'POST' }) }).status).toBe(405);
  });
});
