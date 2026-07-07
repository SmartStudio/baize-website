import { describe, it, expect, vi } from 'vitest';
import { mapFields, getTenantToken, createRecord } from './_feishu';

describe('mapFields', () => {
  it('把表单字段映射为飞书多维表格真实表头列名', () => {
    const out = mapFields({ name: '张三', company: '白泽', contact: 'a@b.com', problem: '想接入 Codex', service: '诊断', _hp: '' });
    expect(out).toEqual({
      '姓名': '张三',
      '公司': '白泽',
      '联系方式': 'a@b.com',
      '感兴趣的服务': '诊断',
      '当前最想解决的问题': '想接入 Codex',
    });
  });
});

describe('getTenantToken', () => {
  it('用 app_id/app_secret 换取 tenant_access_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 0, tenant_access_token: 'tkn' }) });
    const token = await getTenantToken('id', 'secret', fetchMock as unknown as typeof fetch);
    expect(token).toBe('tkn');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal');
    expect(JSON.parse(init.body)).toEqual({ app_id: 'id', app_secret: 'secret' });
  });

  it('飞书返回非 0 code 时抛错', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 10003, msg: 'invalid app_secret' }) });
    await expect(getTenantToken('id', 'bad', fetchMock as unknown as typeof fetch)).rejects.toThrow(/feishu auth failed/);
  });
});

describe('createRecord', () => {
  it('打到正确的 records URL，带 Bearer 授权与 fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 0, data: {} }) });
    await createRecord('t-token', 'appTok', 'tblId', { '姓名': '张三' }, fetchMock as unknown as typeof fetch);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://open.feishu.cn/open-apis/bitable/v1/apps/appTok/tables/tblId/records?user_id_type=open_id');
    expect(init.headers.authorization).toBe('Bearer t-token');
    expect(JSON.parse(init.body)).toEqual({ fields: { '姓名': '张三' } });
  });

  it('写入失败（如 91403 无协作者权限）时抛出带 code 的错误', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 91403, msg: 'Forbidden' }) });
    await expect(createRecord('t', 'a', 'b', {}, fetchMock as unknown as typeof fetch)).rejects.toThrow(/code=91403/);
  });
});
