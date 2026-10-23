import { mapFields, getTenantToken, createRecord, type ContactBody } from './_feishu';

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  BITABLE_APP_TOKEN: string;
  BITABLE_TABLE_ID: string;
  ALLOWED_ORIGIN?: string;
}

// 报错文案跟着提交页面的语言走;中文取值保持上线以来的原文。
const MESSAGES: Record<'zh-CN' | 'en', { missing: string; failed: string }> = {
  'zh-CN': {
    missing: '缺少必填字段',
    failed: '提交失败，请稍后重试，或直接邮件联系 contacts@fxai.ai。',
  },
  en: {
    missing: 'Missing required fields.',
    failed: 'Submission failed. Please try again later or email contacts@fxai.ai.',
  },
};

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
  // body 解析失败时还不知道语言,按中文回落。
  let msg = MESSAGES['zh-CN'];
  try {
    const body = (await request.json()) as ContactBody;
    msg = MESSAGES[body.lang === 'en' ? 'en' : 'zh-CN'];
    // 蜜罐命中，假装成功，不写入飞书
    if (body._hp) return new Response(JSON.stringify({ ok: true }), { headers });
    if (!body.name || !body.contact || !body.problem) {
      return new Response(JSON.stringify({ ok: false, error: msg.missing }), { status: 400, headers });
    }
    const token = await getTenantToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    await createRecord(token, env.BITABLE_APP_TOKEN, env.BITABLE_TABLE_ID, mapFields(body));
    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (e: any) {
    // 详细错误只记服务端日志，不回传给客户端（避免泄露后端实现细节）
    console.error('contact submission failed:', e?.message ?? e);
    return new Response(
      JSON.stringify({ ok: false, error: msg.failed }),
      { status: 500, headers },
    );
  }
};
