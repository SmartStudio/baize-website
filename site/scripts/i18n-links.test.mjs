import { describe, expect, it } from 'vitest';
import { alignLinks } from './i18n-links.mjs';

const titles = new Map([['a', 'Title A']]);
const titleOf = (s) => titles.get(s);

describe('alignLinks', () => {
  it('rewrites link text to the English title of the target', () => {
    const { out, drift } = alignLinks('See <NoteLink slug="a">old text</NoteLink>.', titleOf);
    expect(out).toBe('See <NoteLink slug="a">Title A</NoteLink>.');
    expect(drift).toEqual([{ slug: 'a', text: 'old text', title: 'Title A' }]);
  });

  it('leaves links to notes without an English version alone', () => {
    const src = 'See <NoteLink slug="b">self-translated</NoteLink>.';
    expect(alignLinks(src, titleOf)).toEqual({ out: src, drift: [] });
  });

  it('leaves links that already match alone', () => {
    const src = '<NoteLink slug="a">Title A</NoteLink>';
    expect(alignLinks(src, titleOf).drift).toEqual([]);
  });
});
