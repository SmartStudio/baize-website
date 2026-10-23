export interface ContactBody {
  name: string;
  company: string;
  contact: string;
  problem: string;
  service: string;
  /** 提交表单的页面语言;旧客户端不带时按中文处理。 */
  lang?: 'zh-CN' | 'en';
  _hp?: string;
}

// key 必须与飞书多维表格表头完全一致（表头：姓名 / 公司 / 联系方式 / 感兴趣的服务 / 当前最想解决的问题 / 语言）。
// 「语言」列要先在表里建好再上线,否则每次写表都会因字段不存在而失败。
// 若表格里「感兴趣的服务」是「多选」字段类型，需改成数组：'感兴趣的服务': b.service ? [b.service] : []
export function mapFields(b: ContactBody): Record<string, string> {
  return {
    '姓名': b.name ?? '',
    '公司': b.company ?? '',
    '联系方式': b.contact ?? '',
    '感兴趣的服务': b.service ?? '',
    '当前最想解决的问题': b.problem ?? '',
    '语言': b.lang === 'en' ? 'en' : 'zh-CN',
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
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?user_id_type=open_id`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields }),
    },
  );
  const j: any = await r.json();
  // 常见错误 91403 = 应用没有该多维表格的编辑权限，需在表格「分享」里把应用加为可编辑协作者。
  if (j.code !== 0) throw new Error(`feishu write failed: code=${j.code} msg=${j.msg}`);
}
