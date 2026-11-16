import { describe, expect, it } from 'vitest';
import { faqFromMdx } from './faq';

const zh = `正文。

## 采购 Agent：常见问题

### 第一问？

答案带 **加粗** 和 <NoteLink slug="x">另一篇</NoteLink>，
还换了行。

### 第二问？

1. 列表项一。
2. 见 [来源](https://example.com)。

## 来源

1. 不该进 FAQ。
`;

describe('faqFromMdx', () => {
  it('extracts questions and plain-text answers up to the next h2', () => {
    expect(faqFromMdx(zh)).toEqual([
      { question: '第一问？', answer: '答案带 加粗 和 另一篇， 还换了行。' },
      { question: '第二问？', answer: '列表项一。 见 来源。' },
    ]);
  });

  it('reads an English FAQ section that runs to the end of the file', () => {
    const en = '## Agent identity: FAQ\n\n### Who signs?\n\nThe `owner` does.\n';
    expect(faqFromMdx(en)).toEqual([{ question: 'Who signs?', answer: 'The owner does.' }]);
  });

  it('returns nothing when the note has no FAQ section', () => {
    expect(faqFromMdx('## Setup\n\n### Step one\n\nDo it.\n')).toEqual([]);
  });
});
