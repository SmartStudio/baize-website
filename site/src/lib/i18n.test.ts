import { describe, it, expect } from 'vitest';
import { noteLang, noteSlug, notePath, localePath, withBase, alternates, pairNotes } from './i18n';

const n = (id: string, draft = false) => ({ id, data: { draft } });

describe('i18n paths', () => {
  it('从 collection id 推语言和 slug', () => {
    expect(noteLang('en/agent-sprawl-inventory')).toBe('en');
    expect(noteLang('agent-sprawl-inventory')).toBe('zh-CN');
    expect(noteSlug('en/agent-sprawl-inventory')).toBe('agent-sprawl-inventory');
    expect(noteSlug('agent-sprawl-inventory')).toBe('agent-sprawl-inventory');
  });
  it('笔记与页面路径', () => {
    expect(notePath('a', 'en')).toBe('/en/notes/a/');
    expect(notePath('a', 'zh-CN')).toBe('/notes/a/');
    expect(localePath('/', 'en')).toBe('/en/');
    expect(localePath('/services/', 'en')).toBe('/en/services/');
    expect(localePath('/404', 'en')).toBe('/en/404');
    expect(localePath('/services/', 'zh-CN')).toBe('/services/');
  });
  it('拼 base 只留一个斜杠', () => {
    expect(withBase('/baize-website/', '/en/notes/a/')).toBe('/baize-website/en/notes/a/');
    expect(withBase('/', '/en/')).toBe('/en/');
  });
  it('配对才输出 hreflang,x-default 指中文', () => {
    expect(alternates('/notes/a/', '/en/notes/a/')).toEqual([
      { hreflang: 'zh-Hans', path: '/notes/a/' },
      { hreflang: 'en', path: '/en/notes/a/' },
      { hreflang: 'x-default', path: '/notes/a/' },
    ]);
    expect(alternates('/notes/a/', null)).toEqual([]);
    expect(alternates(null, '/en/notes/a/')).toEqual([]);
  });
});

describe('pairNotes', () => {
  it('按 slug 分成中英两张表,排除 draft', () => {
    const { zh, en } = pairNotes([n('a'), n('en/a'), n('b', true)]);
    expect([...zh.keys()]).toEqual(['a']);
    expect([...en.keys()]).toEqual(['a']);
  });
  it('英文篇没有中文孪生时报错', () => {
    expect(() => pairNotes([n('en/x')])).toThrow('English note without Chinese source: x');
  });
  it('中文孪生是 draft 也算缺失', () => {
    expect(() => pairNotes([n('x', true), n('en/x')])).toThrow('English note without Chinese source: x');
  });
});
