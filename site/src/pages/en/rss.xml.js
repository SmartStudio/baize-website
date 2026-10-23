import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { notePath, noteSlug, pairNotes } from '../../lib/i18n';

export async function GET(context) {
  const notes = [...pairNotes(await getCollection('notes')).en.values()].sort(
    (a, b) => b.data.pubDate - a.data.pubDate
  );

  return rss({
    title: 'Baize Tech Notes',
    description: 'Baize Tech notes on putting AI to work in real teams: engineering practice, security, governance, and rollout.',
    site: context.site,
    customData: '<language>en</language>',
    items: notes.map((n) => ({
      title: n.data.title,
      description: n.data.description,
      pubDate: n.data.pubDate,
      link: notePath(noteSlug(n.id), 'en'),
    })),
  });
}
