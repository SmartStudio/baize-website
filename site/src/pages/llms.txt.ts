import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { notePath, noteSlug, pairNotes } from '../lib/i18n';

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
  '白泽明理（Baize AI）帮企业做 AI 转型：找出最该先改的流程，按岗位培训团队，再派工程师把 Agent 接进 CRM、ERP、HR 系统。';

const INTRO = `白泽明理提供四项服务：

01 · AI 转型咨询：访谈各部门，排出改造优先级和验收口径。
02 · 企业 AI 培训：按岗位授课，课后每个团队留下可复用的 Skill。
03 · FDE 驻场开发：工程师进你的团队，把 Agent 接进 CRM、ERP、HR；包括 AI 研发流设计、Loop Engineering 设计、想法到产品端到端交付。
04 · 工具开发与产品支持：Codex 中转站搭建、LLM API 网关设计、内部工具开发，上线后持续维护。

联系邮箱：contacts@fxai.ai`;

const PAGES: Array<[string, string, string]> = [
  ['/', '首页', '白泽明理是谁、四项服务速览、如何预约 30 分钟免费诊断'],
  ['/services/', '服务', '四项服务的内容、交付物和合作流程'],
  ['/method/', '方法论', '诊断、接入、工程、交付、沉淀，五步落地路径'],
  ['/about/', '关于白泽', '白泽明理名字的由来与工作标准'],
  ['/notes/', '明理笔记', '关于企业 AI 转型的笔记，按分类筛选'],
  ['/contact/', '联系我们', '预约一次 AI 落地诊断'],
];

const EXTRAS: Array<[string, string, string]> = [
  ['/rss.xml', 'RSS 订阅', '明理笔记的更新源'],
  ['/sitemap-index.xml', '站点地图', '全站可抓取页面索引'],
  ['/en/llms.txt', 'English site', 'English index'],
];

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const item = ([path, name, desc]: [string, string, string]) =>
    `- [${name}](${abs(path)}): ${desc}`;

  // 只收中文笔记;英文笔记在 /en/llms.txt。
  const notes = [...pairNotes(await getCollection('notes')).zh.values()].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const body = [
    '# 白泽明理 Baize AI',
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
    ...notes.map((n) => `- [${n.data.title}](${abs(notePath(noteSlug(n.id), 'zh-CN'))}): ${n.data.description}`),
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
