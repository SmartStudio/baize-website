import type { CollectionEntry } from 'astro:content';

type Note = CollectionEntry<'notes'>;
type Category = Note['data']['category'];

/**
 * 分类的展示顺序(与 content.config.ts 的 enum 一致,但那里是校验、这里是排序)。
 */
export const CATEGORIES = [
  'AI普及',
  'AI编程',
  '企业落地',
  '安全可信',
  'Loop与方法论',
  '案例复盘',
] as const satisfies readonly Category[];

/**
 * 中文分类 → URL slug。
 *
 * 归档页的地址必须用 ASCII slug:中文直接进 URL 会被 percent-encode 成
 * /notes/category/AI%E7%BC%96%E7%A8%8B/ 这种,又长又不可读,分享出去也难看。
 */
export const CATEGORY_SLUGS = {
  AI普及: 'ai-basics',
  AI编程: 'ai-coding',
  企业落地: 'enterprise',
  安全可信: 'trust-safety',
  Loop与方法论: 'loop-method',
  案例复盘: 'case-study',
} as const satisfies Record<Category, string>;

/**
 * 每个分类的归档页导语。
 *
 * 归档页最大的 SEO 风险是「薄内容」——一堆标题列表、没有独立价值。所以每个分类
 * 都要有自己的一句话,说清这一类笔记在回答什么问题,而不是套模板。
 */
export const CATEGORY_INTROS = {
  AI普及: '不谈术语堆砌，把 AI 能做什么、不能做什么讲清楚，让非技术岗也能判断该在哪里用它。',
  AI编程: 'AI 参与写代码之后，工程要跟着变：约束怎么立、边界怎么划、产出怎么验收。',
  企业落地: '把 AI 接进真实业务流程时，真正卡住的不是模型，而是上下文、权限与流程本身。',
  安全可信: '权限、审计与可解释——让 AI 的产出敢被采信，出了问题也查得清。',
  Loop与方法论: '让 AI 先自查再交付：把「计划、执行、观察、纠正」设计成可复用的回路。',
  案例复盘: '真实项目里的踩坑、取舍与验证过程，包括那些没走通的路。',
} as const satisfies Record<Category, string>;

export const categorySlug = (c: Category): string => CATEGORY_SLUGS[c];

/**
 * 相关笔记推荐。
 *
 * 11 篇笔记之间原本只有 1 条内链,抓取器进到一篇就走进死胡同,权重传不出去。
 * 排序意图:同一项服务的笔记关联最紧(读者最可能想连着读)→ 其次同分类 → 最后按
 * 时间补足,保证任何一篇都拿得满 limit 篇,不会出现空的推荐位。
 */
export function relatedNotes(current: Note, all: Note[], limit = 3): Note[] {
  const pool = all.filter((n) => n.id !== current.id && !n.data.draft);

  const score = (n: Note): number => {
    let s = 0;
    if (current.data.relatedService && n.data.relatedService === current.data.relatedService) s += 2;
    if (n.data.category === current.data.category) s += 1;
    return s;
  };

  return pool
    .sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    })
    .slice(0, limit);
}
