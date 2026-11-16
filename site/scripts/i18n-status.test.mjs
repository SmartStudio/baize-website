import { describe, it, expect } from 'vitest';
import { sourceHash, computeStatus } from './i18n-status.mjs';

describe('i18n-status', () => {
  it('sourceHash 取 sha256 前 12 位', () => {
    expect(sourceHash('abc')).toBe('ba7816bf8f01');
  });
  it('computeStatus 列出缺译与过期,draft 中文不计 missing', () => {
    const zh = new Map([
      ['a', { content: 'A', draft: false }],
      ['b', { content: 'B', draft: false }],
      ['c', { content: 'C', draft: true }],
    ]);
    const en = new Map([['a', { sourceHash: sourceHash('old') }]]);
    expect(computeStatus(zh, en)).toEqual({ missing: ['b'], stale: ['a'] });
  });
});
