/**
 * 中英双语的路径、配对与 hreflang。只做字符串运算、不 import astro:*,vitest 能直接跑。
 *
 * 配对规则:collection id `en/<slug>` 是中文 id `<slug>` 的英文孪生。路由和组件都从这里取路径,
 * 不在各处手拼 `/en/...`。
 */
export type Lang = 'zh-CN' | 'en';

const EN_PREFIX = 'en/';

export const noteLang = (id: string): Lang => (id.startsWith(EN_PREFIX) ? 'en' : 'zh-CN');

export const noteSlug = (id: string): string => (id.startsWith(EN_PREFIX) ? id.slice(EN_PREFIX.length) : id);

export const notePath = (slug: string, lang: Lang): string => localePath(`/notes/${slug}/`, lang);

/** 中文页面的终态地址 → 指定语言的终态地址。尾斜杠照抄,所以 `/404` 仍是 `/en/404`。 */
export const localePath = (zhPath: string, lang: Lang): string => (lang === 'en' ? `/en${zhPath}` : zhPath);

/** base 恒以 `/` 结尾(BASE_URL),path 恒以 `/` 开头,拼接时去掉一个。 */
export const withBase = (base: string, path: string): string => base + path.slice(1);

export function alternates(zhPath: string | null, enPath: string | null): { hreflang: string; path: string }[] {
  if (!zhPath || !enPath) return [];
  return [
    { hreflang: 'zh-Hans', path: zhPath },
    { hreflang: 'en', path: enPath },
    { hreflang: 'x-default', path: zhPath },
  ];
}

export function pairNotes<T extends { id: string; data: { draft: boolean } }>(
  notes: T[],
): { zh: Map<string, T>; en: Map<string, T> } {
  const zh = new Map<string, T>();
  const en = new Map<string, T>();
  for (const note of notes) {
    if (note.data.draft) continue;
    (noteLang(note.id) === 'en' ? en : zh).set(noteSlug(note.id), note);
  }
  for (const slug of en.keys()) {
    if (!zh.has(slug)) throw new Error(`English note without Chinese source: ${slug}`);
  }
  return { zh, en };
}
