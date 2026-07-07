import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost } from './contact';

const env = {
  FEISHU_APP_ID: 'id',
  FEISHU_APP_SECRET: 'secret',
  BITABLE_APP_TOKEN: 'appTok',
  BITABLE_TABLE_ID: 'tblId',
  ALLOWED_ORIGIN: 'http://localhost:4321',
};

function ctx(body: unknown, origin = 'http://localhost:4321') {
  return {
    request: new Request('https://example.com/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify(body),
    }),
    env,
  } as unknown as Parameters<typeof onRequestPost>[0];
}

afterEach(() => vi.restoreAllMocks());

describe('onRequestPost', () => {
  it('蜜罐命中：直接返回 ok，且不调用飞书', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await onRequestPost(ctx({ name: '张三', contact: 'a@b.com', problem: 'x', _hp: 'bot' }));
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('缺必填字段：返回 400 且 ok=false', async () => {
    const res = await onRequestPost(ctx({ company: '白泽' }));
    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  it('正常提交：换 token 后写入飞书 records 接口并返回 ok', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, tenant_access_token: 't' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: {} })));
    const res = await onRequestPost(
      ctx({ name: '张三', company: '白泽', contact: 'a@b.com', problem: '想接入 Codex', service: '诊断', _hp: '' }),
    );
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(String(fetchSpy.mock.calls[1][0])).toContain('/records?user_id_type=open_id');
  });

  it('飞书写入失败：返回 500 且不泄露后端厂商名', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, tenant_access_token: 't' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 91403, msg: 'Forbidden' })));
    const res = await onRequestPost(
      ctx({ name: '张三', company: '白泽', contact: 'a@b.com', problem: 'x', service: '诊断', _hp: '' }),
    );
    expect(res.status).toBe(500);
    const j = await res.json();
    expect(j.ok).toBe(false);
    expect(JSON.stringify(j)).not.toContain('feishu');
  });
});
