export interface ContactBody {
  name: string;
  company: string;
  contact: string;
  problem: string;
  service: string;
  _hp?: string;
}

export function mapFields(b: ContactBody): Record<string, string> {
  return {
    '姓名': b.name ?? '',
    '公司团队': b.company ?? '',
    '联系方式': b.contact ?? '',
    '最想解决的问题': b.problem ?? '',
    '感兴趣的服务': b.service ?? '',
  };
}

export async function getTenantToken(
  appId: string,
  appSecret: string,
  f: typeof fetch = fetch,
): Promise<string> {
  const r = await f('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const j: any = await r.json();
  if (j.code !== 0) throw new Error(`feishu auth failed: ${j.msg || j.code}`);
  return j.tenant_access_token as string;
}

export async function createRecord(
  token: string,
  appToken: string,
  tableId: string,
  fields: Record<string, string>,
  f: typeof fetch = fetch,
): Promise<void> {
  const r = await f(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields }),
    },
  );
  const j: any = await r.json();
  if (j.code !== 0) throw new Error(`feishu write failed: ${j.msg || j.code}`);
}
