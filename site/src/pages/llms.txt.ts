import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// llms.txt(https://llmstxt.org)是给大模型读的站点索引。规范要求:
//   1. 一个 H1 标题;
//   2. 紧跟一个 > 引言块作为摘要;
//   3. 之后可以有任意非标题的自由段落;
//   4. 每个 H2 小节都是「链接列表」——每一条必须是 Markdown 链接 `- [名称](URL): 说明`,
//      裸路径不算链接,校验器会报「文件似乎不包含任何链接」。
//   5. `## Optional` 小节表示「上下文紧张时可以跳过」。
//
// 由端点生成而非手写静态文件:笔记列表以前是手抄的,写到 6 篇时就和实际的 8 篇脱节了。
// 现在和 rss.xml.js 读同一个 content collection,新增笔记自动出现。
//
// URL 一律带尾斜杠:CF Pages 会把 /notes/x 308 跳到 /notes/x/,直接给终态地址可以让
// 抓取方少吃一次重定向。

const SUMMARY =
  '企业 AI 提效与经营流程重塑顾问：帮助企业把 AI 嵌入经营、研发与交付流程，形成可验证、可复用、可持续扩展的组织效率。';

const INTRO = `白泽明理提供五项工程服务，按三层阶梯组织：

01 · 接入 Access——先把 AI 稳定、可控、可审计地接进来：Codex 中转站搭建、LLM API 网关设计。
02 · 工程 Engineering——再把 AI 变成可迭代、可验证的工程能力：AI 研发流设计、Loop Engineering 设计。
03 · 交付 Delivery——最终把能力设计成真实产品与增长路径：想法到产品端到端交付设计。

联系邮箱：fxai.labs@gmail.com`;

const PAGES: Array<[string, string, string]> = [
  ['/', '首页', '白泽明理是谁、三层服务阶梯速览、如何开始一次诊断'],
  ['/services/', '服务', '五项服务的完整阶梯，交付物、受众映射与合作边界'],
  ['/method/', '方法论', '诊断、接入、工程、交付、沉淀，五步落地路径'],
  ['/about/', '关于白泽', '白泽明理名字的由来与 Formal eXplainable AI 工作标准'],
  ['/notes/', '明理笔记', '关于 AI 接入、工程与落地的笔记'],
  ['/contact/', '联系我们', '预约一次 AI 落地诊断'],
];

const EXTRAS: Array<[string, string, string]> = [
  ['/rss.xml', 'RSS 订阅', '明理笔记的更新源'],
  ['/sitemap-index.xml', '站点地图', '全站可抓取页面索引'],
];

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const item = ([path, name, desc]: [string, string, string]) =>
    `- [${name}](${abs(path)}): ${desc}`;

  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const body = [
    '# 白泽明理 Baize Tech',
    '',
    `> ${SUMMARY}`,
    '',
    INTRO,
    '',
    '## 关键页面',
    '',
    ...PAGES.map(item),
    '',
    '## 明理笔记',
    '',
    ...notes.map((n) => `- [${n.data.title}](${abs(`/notes/${n.id}/`)}): ${n.data.description}`),
    '',
    '## Optional',
    '',
    ...EXTRAS.map(item),
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
