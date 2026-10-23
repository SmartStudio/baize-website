import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { renameSync, rmdirSync } from 'node:fs';

const target = process.env.PUBLIC_DEPLOY_TARGET ?? 'cloudflare';
// canonical 主域恒为 CF；两处构建都用它做 site，从而 sitemap/canonical 去重指向主站
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://baize.example.com';
const GH_BASE = process.env.PUBLIC_GH_BASE ?? '/';

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

export default defineConfig({
  site: SITE,
  base: target === 'ghpages' ? GH_BASE : '/',
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
  integrations: [mdx(), sitemap({ i18n: { defaultLocale: 'zh', locales: { zh: 'zh-Hans', en: 'en' } } }), en404],
  vite: {
    define: {
      'import.meta.env.PUBLIC_DEPLOY_TARGET': JSON.stringify(target),
    },
  },
});
