export type FaqItem = { question: string; answer: string };

// 笔记约定:FAQ 是标题含「常见问题」或「FAQ」的那个 h2,每问一个 h3,答案是到下一个 h3/h2 为止的段落。
const FAQ_H2 = /^## [^\n]*(常见问题|FAQ)[^\n]*$/m;

function toPlainText(md: string): string {
  return md
    .replace(/<NoteLink[^>]*>([\s\S]*?)<\/NoteLink>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

/** 从 MDX 原文抽出 FAQ 问答,供 FAQPage JSON-LD 使用。页面上看得到什么,结构化数据就只写什么。 */
export function faqFromMdx(body: string): FaqItem[] {
  const start = body.match(FAQ_H2);
  if (!start || start.index === undefined) return [];
  const rest = body.slice(start.index + start[0].length);
  const end = rest.search(/^## /m);
  const section = end === -1 ? rest : rest.slice(0, end);
  return section
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const nl = block.indexOf('\n');
      return { question: toPlainText(block.slice(0, nl)), answer: toPlainText(block.slice(nl + 1)) };
    })
    .filter((item) => item.question && item.answer);
}
