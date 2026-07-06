import { mapFields, getTenantToken, createRecord, type ContactBody } from './_feishu';

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  BITABLE_APP_TOKEN: string;
  BITABLE_TABLE_ID: string;
  ALLOWED_ORIGIN?: string;
}

function cors(origin: string, allowed?: string): Record<string, string> {
  const list = (allowed ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = list.includes(origin) ? origin : (list[0] ?? '');
  return {
    'access-control-allow-origin': allow || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

export const onRequestOptions: PagesFunction<Env> = ({ request, env }) =>
  new Response(null, { status: 204, headers: cors(request.headers.get('origin') ?? '', env.ALLOWED_ORIGIN) });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin') ?? '';
  const headers = { 'content-type': 'application/json', ...cors(origin, env.ALLOWED_ORIGIN) };
  try {
    const body = (await request.json()) as ContactBody;
    // 蜜罐命中，假装成功，不写入飞书
    if (body._hp) return new Response(JSON.stringify({ ok: true }), { headers });
    if (!body.name || !body.contact || !body.problem) {
      return new Response(JSON.stringify({ ok: false, error: '缺少必填字段' }), { status: 400, headers });
    }
    const token = await getTenantToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    await createRecord(token, env.BITABLE_APP_TOKEN, env.BITABLE_TABLE_ID, mapFields(body));
    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message ?? '服务器错误' }), { status: 500, headers });
  }
};
