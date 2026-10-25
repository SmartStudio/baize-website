import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';

const target = process.env.PUBLIC_DEPLOY_TARGET ?? 'cloudflare';
// canonical 主域恒为 CF；两处构建都用它做 site，从而 sitemap/canonical 去重指向主站
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://baize.example.com';
const GH_BASE = process.env.PUBLIC_GH_BASE ?? '/';
const BASE = target === 'ghpages' ? GH_BASE : '/';

// sitemap 的 lastmod:笔记取 updatedDate ?? pubDate,列表页取该语言最新一篇的日期。
// 其他页面不给 lastmod,Google 对不可信的 lastmod 会整体忽略,宁缺毋滥。
// 这里直接读 frontmatter 文本:integration 配置阶段拿不到 content collection。
function noteLastmods() {
  const map = new Map();
  for (const [dir, prefix] of [['src/content/notes/', '/notes/'], ['src/content/notes/en/', '/en/notes/']]) {
    for (const file of readdirSync(new URL(dir, import.meta.url)).filter((f) => f.endsWith('.mdx'))) {
      const fm = readFileSync(new URL(dir + file, import.meta.url), 'utf8').split(/^---$/m)[1] ?? '';
      if (/^draft:\s*true/m.test(fm)) continue;
      const date = (fm.match(/^updatedDate:\s*['"]?([\d-]+)/m) ?? fm.match(/^pubDate:\s*['"]?([\d-]+)/m))?.[1];
      if (!date) continue;
      map.set(`${prefix}${file.replace(/\.mdx$/, '')}/`, date);
      if (!map.get(prefix) || map.get(prefix) < date) map.set(prefix, date);
    }
  }
  return map;
}
const LASTMOD = noteLastmods();

function serializeSitemapItem(item) {
  const path = '/' + new URL(item.url).pathname.slice(BASE.length);
  const lastmod = LASTMOD.get(path);
  if (lastmod) item.lastmod = new Date(lastmod).toISOString();
  // 页面 <head> 里的 hreflang 带 x-default(指中文版),sitemap 也补上,两处保持一致。
  const zh = item.links?.find((l) => l.lang === 'zh-Hans');
  if (zh) item.links = [...item.links, { lang: 'x-default', url: zh.url }];
  return item;
}

// Astro 只把根路由 /404 输出成 404.html,/en/404 会落成 en/404/index.html。
// CF Pages 对缺失地址按目录就近找 404.html,所以构建完把英文 404 挪到 en/404.html。
const en404 = {
  name: 'en-404-html',
  hooks: {
    'astro:build:done': ({ dir }) => {
      renameSync(new URL('en/404/index.html', dir), new URL('en/404.html', dir));
      rmdirSync(new URL('en/404/', dir));
    },
  },
};

// 构建产物里写一份 /build.txt(本次构建的 commit sha)。scripts/indexnow.mjs 轮询它,
// 确认 CF Pages 已经把这次 push 部署上线,再把改动的 URL 推给 IndexNow。
// CF Pages 构建注入 CF_PAGES_COMMIT_SHA,GH Actions 注入 GITHUB_SHA;本地构建两者都没有就不写。
const buildId = {
  name: 'build-id',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const sha = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA;
      if (sha) writeFileSync(new URL('build.txt', dir), `${sha}\n`);
    },
  },
};

export default defineConfig({
  site: SITE,
  base: BASE,
  // 构建产物是 services/index.html 这类目录索引,CF Pages(和 GH Pages)因此会把
  // /services 308 跳到 /services/。'always' 让 dev/preview 也执行同一约定:
  // 少写一个斜杠就当场 404,而不是等上线后每次点击白吃一跳。
  // 注意:这个配置本身不消除 308,它只是守卫。真正的修复是站内 href 与 canonical
  // 都直接给终态地址(见 Seo.astro 里关于 path 的说明)。
  trailingSlash: 'always',
  // 代码块用浅色 Shiki 主题,贴合站点「冷黑字/纯白底」的基调(背景再由 NoteLayout 统一压成 paper-100)。
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: false },
  },
  // sitemap 的 i18n 按 URL 前缀(/en/)给配对页面加 xhtml:link hreflang;中文是默认语言、不带前缀。
  integrations: [
    mdx(),
    sitemap({ i18n: { defaultLocale: 'zh', locales: { zh: 'zh-Hans', en: 'en' } }, serialize: serializeSitemapItem }),
    en404,
    buildId,
  ],
  vite: {
    define: {
      'import.meta.env.PUBLIC_DEPLOY_TARGET': JSON.stringify(target),
    },
  },
});
