// pnpm check:i18n:在构建产物上检查英文站。用法 node scripts/check-i18n-dist.mjs <distDir> [base]
// GH 镜像要带 base 跑一遍(/baize-website/),抓丢了前缀的站内链接。
// 读代码看不出的 SEO/链接缺陷只能在 dist 上抓,所以这里只认产物。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CJK = /[一-鿿]/;

/**
 * 去掉 <script>、<style>、HTML 注释后,返回含 CJK 的文本片段。
 * 唯一豁免:开标签自带 lang="zh..." 的元素(页头「中文」切换链接),它本来就该是中文。
 */
export function visibleCjk(html) {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<((?!html\b)[a-z][a-z0-9]*)\b[^>]*\blang="zh[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, '');
  return text
    .split(/<[^>]*>/)
    .map((t) => t.trim())
    .filter((t) => CJK.test(t));
}

/** 站内 href → dist 里的相对文件路径;不以 base 开头的站内绝对路径返回 null。 */
export function hrefTarget(href, base) {
  if (!href.startsWith(base)) return null;
  const rest = href.slice(base.length).replace(/[?#].*$/, '');
  if (rest === '' || rest.endsWith('/')) return `${rest}index.html`;
  const last = rest.split('/').pop();
  return last.includes('.') ? rest : `${rest}.html`;
}

/**
 * 没有 alt 或 alt 为空的 <img> 标签。Bing 站长工具把 alt="" 也报成「图片缺 alt」,
 * 所以这里不区分装饰图:站上的图都该有一句描述。
 */
export function imgsMissingAlt(html) {
  // 标签和属性都按引号切:alt="a > b" 里的 > 不算标签结束,title="… alt='x' …" 里的 alt 不算属性。
  const tags = html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<img\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi);
  return [...tags]
    .filter((m) => {
      let alt = null;
      for (const a of m[1].matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
        if (a[1].toLowerCase() === 'alt') alt = a[2] ?? a[3] ?? a[4] ?? '';
      }
      return alt === null || !decodeSpaces(alt).trim();
    })
    .map((m) => m[0]);
}

const decodeSpaces = (s) => s.replace(/&nbsp;|&#160;|&#x0*a0;|&#32;|&#x0*20;/gi, ' ').replace(/\u00a0/g, ' ');

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** 页面上所有 <link rel="alternate" hreflang> 的 href 对应的 dist 文件。 */
const alternateFiles = (html) =>
  [...html.matchAll(/<link\b[^>]*\brel="alternate"[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => attr(tag, 'hreflang'))
    .map((tag) => hrefTarget(new URL(attr(tag, 'href')).pathname, '/'));

function apiNoteSlugs(notesEnDir) {
  if (!existsSync(notesEnDir)) return new Set();
  return new Set(
    readdirSync(notesEnDir)
      .filter((f) => f.endsWith('.mdx'))
      .filter((f) => /^ctaVariant:\s*['"]?api['"]?\s*$/m.test(readFileSync(join(notesEnDir, f), 'utf8').split(/\n---/)[0]))
      .map((f) => f.slice(0, -'.mdx'.length)),
  );
}

/** href → 站内绝对路径(去掉 query/hash);外站、协议相对、mailto 等返回 null。同源的绝对 URL 也算站内。 */
export function sitePath(href, origin) {
  if (href.startsWith('//')) return null;
  if (href.startsWith('/')) return href.replace(/[?#].*$/, '');
  if (!origin || !/^https?:\/\//i.test(href)) return null;
  try {
    const u = new URL(href);
    return u.origin === new URL(origin).origin ? u.pathname : null;
  } catch {
    return null;
  }
}

export function checkDist(dist, base, { redirectsFile, notesEnDir, origin = 'https://fxai.ai' }) {
  const errors = [];
  const add = (msg, file) => errors.push({ msg, file });
  const exists = (rel) => existsSync(join(dist, rel));
  const read = (rel) => readFileSync(join(dist, rel), 'utf8');
  const apiSlugs = apiNoteSlugs(notesEnDir);

  const htmlFiles = walk(dist)
    .map((p) => relative(dist, p))
    .filter((p) => p.endsWith('.html'));

  // hreflang 双向配对:所有页面都查,中文页指向的英文页也要指回来。
  for (const file of htmlFiles) {
    const targets = alternateFiles(read(file));
    for (const target of targets) {
      if (target === file) continue;
      if (!exists(target)) add(`hreflang 目标不存在: /${target}`, file);
      else if (!alternateFiles(read(target)).includes(file)) add(`hreflang 目标没有指回本页: /${target}`, file);
    }
  }

  for (const file of htmlFiles) {
    const html = read(file);
    for (const tag of imgsMissingAlt(html)) add(`图片缺 alt: ${tag.slice(0, 80)}`, file);
    // 中文页上指向英文站的链接(页头 EN 切换等):只有中文版的笔记不能指向不存在的 /en/notes/<slug>/。
    if (file.startsWith('en/')) continue;
    // 只看 <a>:<link rel="canonical|alternate"> 在镜像站上本来就指向正式站 https://fxai.ai/...,hreflang 另有上面的配对检查。
    for (const m of html.matchAll(/<a\b(?:[^>"']|"[^"]*"|'[^']*')*?\shref="([^"]*)"/gi)) {
      const path = sitePath(m[1], origin);
      if (path === null || !(path.startsWith('/en/') || path.startsWith(`${base}en/`))) continue;
      const target = hrefTarget(path, base);
      if (target === null) add(`站内链接缺 base 前缀 ${base}: ${m[1]}`, file);
      else if (!exists(target)) add(`链接目标不存在: ${m[1]}`, file);
    }
  }

  // sitemap 里的每个地址都要在产物里有页面,不能让搜索引擎拿到 404。
  for (const sm of walk(dist).map((p) => relative(dist, p)).filter((p) => /^sitemap-\d+\.xml$/.test(p))) {
    for (const m of read(sm).matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const target = hrefTarget(new URL(m[1]).pathname, base);
      if (target === null) add(`sitemap 地址不在 base ${base} 下: ${m[1]}`, sm);
      else if (!exists(target)) add(`sitemap 地址没有页面: ${m[1]}`, sm);
    }
  }

  for (const file of htmlFiles.filter((p) => p.startsWith('en/'))) {
    const html = read(file);
    for (const t of visibleCjk(html)) add(`可见中文: ${t.slice(0, 40)}`, file);
    for (const m of html.matchAll(/\b(alt|title|aria-label|placeholder)="([^"]*)"/g)) {
      if (CJK.test(m[2])) add(`属性里有中文: ${m[1]}="${m[2].slice(0, 40)}"`, file);
    }
    if (html.includes('wechat-qr') || html.includes('微信')) add('出现微信/二维码', file);
    const slug = file.match(/^en\/notes\/([^/]+)\/index\.html$/)?.[1];
    if (html.includes('api.fxai.ai/sign-up') && !(slug && apiSlugs.has(slug))) {
      add('非 api 笔记出现 api.fxai.ai/sign-up', file);
    }
    for (const m of html.matchAll(/\bhref="(\/[^"]*)"/g)) {
      const href = m[1];
      if (href.startsWith('//')) continue;
      const target = hrefTarget(href, base);
      if (target === null) add(`站内链接缺 base 前缀 ${base}: ${href}`, file);
      else if (!exists(target)) add(`链接目标不存在: ${href}`, file);
    }
  }

  if (redirectsFile && existsSync(redirectsFile)) {
    for (const line of readFileSync(redirectsFile, 'utf8').split('\n')) {
      const [from, to] = line.trim().split(/\s+/);
      if (!from || from.startsWith('#') || !to) continue;
      const target = hrefTarget(to, '/');
      if (!target || !exists(target)) add(`_redirects 目标不存在: ${from} → ${to}`, '_redirects');
    }
  }

  for (const feed of ['llms.txt', 'rss.xml']) {
    if (exists(feed) && read(feed).includes('/en/notes/')) add('中文索引里混进了 /en/notes/', feed);
  }

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dist = 'dist', base = '/'] = process.argv.slice(2);
  const errors = checkDist(dist, base, {
    redirectsFile: fileURLToPath(new URL('../public/_redirects', import.meta.url)),
    notesEnDir: fileURLToPath(new URL('../src/content/notes/en/', import.meta.url)),
    origin: new URL(process.env.PUBLIC_SITE_URL ?? 'https://fxai.ai').origin,
  });
  if (errors.length === 0) {
    console.log(`check:i18n ok (${dist}, base ${base})`);
  } else {
    // 同一条错误常出现在几十页上(比如页头链接),按消息归并,每条附次数、页数和一个例子。
    const byMsg = new Map();
    for (const { msg, file } of errors) byMsg.set(msg, [...(byMsg.get(msg) ?? []), file]);
    for (const [msg, files] of byMsg) console.log(`${msg}  (${files.length} 处 / ${new Set(files).size} 页, 如 ${files[0]})`);
    console.log(`check:i18n failed: ${byMsg.size} 种错误, ${errors.length} 处 (${dist}, base ${base})`);
    process.exit(1);
  }
}
