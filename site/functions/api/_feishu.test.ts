import { describe, it, expect, vi } from 'vitest';
import { mapFields, getTenantToken } from './_feishu';

describe('mapFields', () => {
  it('把表单字段映射为 Bitable fields 列名', () => {
    const out = mapFields({ name: '张三', company: '白泽', contact: 'a@b.com', problem: '想接入 Codex', service: '诊断', _hp: '' });
    expect(out).toEqual({
      '姓名': '张三', '公司团队': '白泽', '联系方式': 'a@b.com',
      '最想解决的问题': '想接入 Codex', '感兴趣的服务': '诊断',
    });
  });
});

describe('getTenantToken', () => {
  it('用 app_id/app_secret 换取 tenant_access_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 0, tenant_access_token: 'tkn' }) });
    const token = await getTenantToken('id', 'secret', fetchMock as unknown as typeof fetch);
    expect(token).toBe('tkn');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ app_id: 'id', app_secret: 'secret' });
  });
});
