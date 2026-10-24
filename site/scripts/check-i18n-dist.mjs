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

export function checkDist(dist, base, { redirectsFile, notesEnDir }) {
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
