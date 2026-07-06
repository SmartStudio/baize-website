import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
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
      link: `/notes/${n.id}/`,
    })),
  });
}
