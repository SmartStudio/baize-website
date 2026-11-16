/**
 * 标题里的少量行内标记。不用 set:html:scoped 样式按 data-astro-cid 属性匹配,
 * 注入的 HTML 拿不到这个属性,`h1 em` 之类的样式会静默失效。所以每个页面组件自己渲染这几种片段。
 */
export const BR = { br: true } as const;

export type Rich = (string | { em: string } | { nw: string } | typeof BR)[];
