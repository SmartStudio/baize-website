import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { notePath, noteSlug, pairNotes } from '../../lib/i18n';

// 英文版 llms.txt,格式规则同 src/pages/llms.txt.ts:一个 H1、一段 > 摘要、自由段落、
// 每个 H2 都是 `- [名称](URL): 说明` 链接列表。只收英文笔记。

const SUMMARY =
  'Baize Tech is an AI transformation consultancy. It helps companies put AI into operations, engineering, and delivery workflows. Work is remote-first.';

const INTRO = `Baize Tech offers four services:

01 · AI transformation consulting: interview each team, rank the workflows to change first, and agree how results will be measured.
02 · Team AI training: role-based sessions; each team leaves with reusable skills for its own tasks.
03 · Forward deployed engineering: remote-first engineers work inside your team and connect agents to CRM, ERP, and HR systems.
04 · Internal tools and product support: custom internal tools, maintained after launch.

Contact: contacts@fxai.ai`;

const PAGES: Array<[string, string, string]> = [
  ['/en/', 'Home', 'Who Baize Tech is, the four services, and how to book a first call'],
  ['/en/services/', 'Services', 'Consulting, training, forward deployed engineering, and tools: scope and deliverables'],
  ['/en/method/', 'Method', 'How an engagement runs, from diagnosis to rollout'],
  ['/en/about/', 'About', 'The team and the Formal eXplainable AI working standard'],
  ['/en/notes/', 'Notes', 'Notes on putting AI to work in real teams, filterable by topic'],
  ['/en/contact/', 'Contact', 'Book a call by email or the contact form'],
];

const EXTRAS: Array<[string, string, string]> = [
  ['/en/rss.xml', 'RSS feed', 'Updates to the English notes'],
  ['/sitemap-index.xml', 'Sitemap', 'Index of every crawlable page'],
  ['/llms.txt', 'Chinese site', 'Chinese index, with every note in Chinese'],
];

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const item = ([path, name, desc]: [string, string, string]) => `- [${name}](${abs(path)}): ${desc}`;

  const notes = [...pairNotes(await getCollection('notes')).en.values()].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const body = [
    '# Baize Tech',
    '',
    `> ${SUMMARY}`,
    '',
    INTRO,
    '',
    '## Key pages',
    '',
    ...PAGES.map(item),
    '',
    '## Notes',
    '',
    ...notes.map((n) => `- [${n.data.title}](${abs(notePath(noteSlug(n.id), 'en'))}): ${n.data.description}`),
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
