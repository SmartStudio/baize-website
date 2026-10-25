// Baidu 站长平台文件验证（第二份）。CF Pages 会把 /x.html 308 到 /x，百度验证不跟跳转，
// 所以用 Pages Function 在原路径直接回 200 和 32 字节验证码。只匹配这一个路径。
export const BAIDU_VERIFY_BODY_Z21 = '2023fc444f09ce0dcb014d09b94d4091';

export const onRequest = ({ request }: { request: Request }): Response => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  return new Response(request.method === 'HEAD' ? null : BAIDU_VERIFY_BODY_Z21, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'content-length': '32' },
  });
};
