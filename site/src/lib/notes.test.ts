import { describe, it, expect } from 'vitest';
import { relatedNotes } from './notes';

const note = (id: string, lang: 'zh-CN' | 'en') =>
  ({
    id,
    data: { lang, draft: false, pubDate: new Date('2026-10-01'), category: '企业落地', relatedService: 'consulting' },
  }) as any;

const zhA = note('a', 'zh-CN');
const zhB = note('b', 'zh-CN');
const enA = note('en/a', 'en');
const all = [zhA, zhB, enA];

describe('relatedNotes', () => {
  it('中文笔记只推荐中文', () => {
    expect(relatedNotes(zhA, all).map((n) => n.data.lang)).not.toContain('en');
  });
  it('英文笔记只推荐英文', () => {
    expect(relatedNotes(enA, all).map((n) => n.data.lang)).not.toContain('zh-CN');
  });
});
