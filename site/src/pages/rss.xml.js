import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { notePath, noteSlug, pairNotes } from '../lib/i18n';

export async function GET(context) {
  // 只收中文笔记;英文笔记在 /en/rss.xml。
  const notes = [...pairNotes(await getCollection('notes')).zh.values()].sort(
    (a, b) => b.data.pubDate - a.data.pubDate
  );

  return rss({
    title: '明理笔记 · 白泽明理',
    description: '白泽明理关于 AI 接入、工程与落地的笔记。',
    site: context.site,
    items: notes.map((n) => ({
      title: n.data.title,
      description: n.data.description,
      pubDate: n.data.pubDate,
      link: notePath(noteSlug(n.id), 'zh-CN'),
    })),
  });
}
