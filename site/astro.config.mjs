import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const target = process.env.PUBLIC_DEPLOY_TARGET ?? 'cloudflare';
// canonical 主域恒为 CF；两处构建都用它做 site，从而 sitemap/canonical 去重指向主站
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://baize.example.com';
const GH_BASE = process.env.PUBLIC_GH_BASE ?? '/';
const BASE = target === 'ghpages' ? GH_BASE : '/';

// sitemap 的 lastmod:笔记取 updatedDate ?? pubDate;列表页、分类页取该语言(该分类)最新一篇的日期;
// 首页列最新笔记,取「最新一篇」和 STATIC_LASTMOD 里首页文案日期的较晚者。
// 其他静态页取 STATIC_LASTMOD。Google 对不可信的 lastmod 会整体忽略,所以只写真改过内容的日期。
// 这里直接读 frontmatter 文本:integration 配置阶段拿不到 content collection。
const CATEGORY_SLUGS = { AI普及: 'ai-basics', AI编程: 'ai-coding', 企业落地: 'enterprise', 安全可信: 'trust-safety', Loop与方法论: 'loop-method', 案例复盘: 'case-study' };
const later = (map, key, date) => { if (!map.get(key) || map.get(key) < date) map.set(key, date); };

// 静态页内容(页面 + 文案 i18n 文件)最后一次改动的日期,中英同一份。改了这些页的文案就顺手改这里。
// CF Pages 是浅克隆,构建时 git log 拿不到真实日期,所以写死;本地完整克隆构建时会对照 git 提醒过期项。
const STATIC_LASTMOD = {
  '/': { date: '2026-10-25', files: ['src/pages/index.astro', 'src/pages/en/index.astro', 'src/components/pages/Home.astro', 'src/i18n/home.ts'] },
  '/about/': { date: '2026-10-25', files: ['src/pages/about.astro', 'src/pages/en/about.astro', 'src/components/pages/About.astro', 'src/i18n/about.ts'] },
  '/contact/': { date: '2026-10-25', files: ['src/pages/contact.astro', 'src/pages/en/contact.astro', 'src/components/pages/Contact.astro', 'src/i18n/contact.ts', 'src/components/ContactForm.astro'] },
  '/method/': { date: '2026-10-25', files: ['src/pages/method.astro', 'src/pages/en/method.astro', 'src/components/pages/Method.astro', 'src/i18n/method.ts'] },
  '/services/': { date: '2026-10-25', files: ['src/pages/services.astro', 'src/pages/en/services.astro', 'src/components/pages/Services.astro', 'src/i18n/services.ts'] },
  '/fxai/privacy/': { date: '2026-08-13', files: ['src/pages/fxai/privacy.mdx'], en: '/fxai/privacy/en/', enFiles: ['src/pages/fxai/privacy/en.mdx'] },
  '/fxai/terms/': { date: '2026-08-13', files: ['src/pages/fxai/terms.mdx'], en: '/fxai/terms/en/', enFiles: ['src/pages/fxai/terms/en.mdx'] },
};

function warnStaleStaticLastmod() {
  try {
    const run = (...a) => execFileSync('git', a, { cwd: new URL('.', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (run('rev-parse', '--is-shallow-repository') !== 'false') return;
    for (const [path, { date, files, enFiles = [] }] of Object.entries(STATIC_LASTMOD)) {
      const git = run('log', '-1', '--format=%cs', '--', ...files, ...enFiles);
      if (git && git > date) console.warn(`[sitemap] STATIC_LASTMOD['${path}'] is ${date} but git says ${git}; update astro.config.mjs`);
    }
  } catch {
    // 没有 git 或不在仓库里:跳过提醒,不影响构建。
  }
}

function sitemapLastmods() {
  const map = new Map();
  for (const [dir, prefix] of [['src/content/notes/', '/notes/'], ['src/content/notes/en/', '/en/notes/']]) {
    for (const file of readdirSync(new URL(dir, import.meta.url)).filter((f) => f.endsWith('.mdx'))) {
      const fm = readFileSync(new URL(dir + file, import.meta.url), 'utf8').split(/^---$/m)[1] ?? '';
      if (/^draft:\s*true/m.test(fm)) continue;
      const date = (fm.match(/^updatedDate:\s*['"]?([\d-]+)/m) ?? fm.match(/^pubDate:\s*['"]?([\d-]+)/m))?.[1];
      if (!date) continue;
      map.set(`${prefix}${file.replace(/\.mdx$/, '')}/`, date);
      later(map, prefix, date);
      later(map, prefix === '/notes/' ? '/' : '/en/', date);
      const cat = CATEGORY_SLUGS[fm.match(/^category:\s*['"]?([^'"\n]+)/m)?.[1]?.trim()];
      if (cat) later(map, `${prefix}category/${cat}/`, date);
    }
  }
  for (const [path, { date, en }] of Object.entries(STATIC_LASTMOD)) {
    later(map, path, date);
    later(map, en ?? (path === '/' ? '/en/' : `/en${path}`), date);
  }
  return map;
}
warnStaleStaticLastmod();
const LASTMOD = sitemapLastmods();

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
