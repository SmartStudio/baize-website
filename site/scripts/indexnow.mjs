// 部署上线后把本次 push 里新发布或正文有改动的笔记,一篇一篇推给 IndexNow(Bing、Yandex 等共用)。
// 由 .github/workflows/indexnow.yml 在 push 到 master 后调用;也可以本地手动跑:
//   node scripts/indexnow.mjs --from <sha> --to <sha> [--dry-run]
//   node scripts/indexnow.mjs --urls "/notes/a/ /en/notes/b/" [--dry-run]
// 规则(11/5 Bing 收录整改方案):
// 1. 只交单篇笔记页 /notes/<slug>/、/en/notes/<slug>/。列表页、分类页、首页、静态页、sitemap 一律不交。
// 2. 每篇单独一次请求。不做整批、整站或 sitemap 重交;一次 push 最多交 MAX_PER_RUN 篇(按路径排序的前 10 篇),超出的在 CI 日志里逐条列出,留待下次或手动补交。
// 3. 交之前逐篇抓线上页:必须直接返回 200(301/404 都不交,只有中文版的笔记对应的 /en/ 自然 404 被跳过),
//    不能是 noindex,必须有 canonical 且指向它自己,页面要已经是新内容(找得到新增的文字,或删掉的文字已经不在)。
// IndexNow 只是通知有更新,不保证收录。密钥是公开文件 public/<key>.txt,不是机密。
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://fxai.ai';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_PER_RUN = 10;
const MIN_LINE = 6; // 指纹行(squash 后)最短字符数

const siteDir = fileURLToPath(new URL('..', import.meta.url));

export function indexNowKey(publicDir = `${siteDir}public`) {
  const files = readdirSync(publicDir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (files.length !== 1) throw new Error(`expected exactly one IndexNow key file in public/, found ${files.length}`);
  return files[0].slice(0, -4);
}

/** 单篇笔记页路径:/notes/<slug>/ 或 /en/notes/<slug>/。列表页、分类页、分页都不算。 */
export function isNotePath(p) {
  const m = /^(?:\/en)?\/notes\/([a-z0-9][a-z0-9-]*)\/$/.exec(p);
  return Boolean(m) && !['category', 'page', 'tag', 'tags'].includes(m[1]);
}

const fmField = (fm, name) => {
  const v = fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? '';
  return v.replace(/^(['"])(.*)\1$/, '$2');
};

export function parseNote(text) {
  const parts = text.split(/^---\s*$/m);
  const fm = parts.length >= 3 ? parts[1] : '';
  const body = parts.length >= 3 ? parts.slice(2).join('---') : text;
  return { draft: /^draft:\s*true/m.test(fm), title: fmField(fm, 'title'), description: fmField(fm, 'description'), seoTitle: fmField(fm, 'seoTitle'), seoDescription: fmField(fm, 'seoDescription'), body };
}

/** 只留字母、数字和汉字:去掉空白、标点、符号(含排版替换出的弯引号、省略号、破折号),两边用同一规则比对。 */
// 数字前的正负号、数字间的小数点保留(1.5 → -1.5 是内容改动),其余标点符号抹掉。
const restoreNums = (s) => s.replace(/\u0002([PM])\u0002/g, (_, c) => c === 'P' ? '+' : '-').replace(/\u0002/g, '').replace(/\u0003/g, '.');
export const squash = (s) => restoreNums(s.normalize('NFKC').replace(/(^|[^+\-\d.])([+-])(?=\d)/g, (_, pre, sign) => `${pre}\u0002${sign === '+' ? 'P' : 'M'}\u0002`).replace(/(\d)\.(\d)/g, '$1\u0003$2').replace(/[\s\p{P}\p{S}]+/gu, ''));
// 代码/行内代码只去空白,保留 < { = 等会渲染出来的符号。
// 代码内容:折叠空白( 标记代码段边界,和正文比对时不会误判相邻文字),保留符号。
// 缩进、字符串里的空格属于内容,sourceKey 里保留原样;指纹里折叠空白便于和 HTML 比对。
const squashCode = (s) => s.normalize('NFKC').replace(/\s+/g, '');

/**
 * MDX 正文 → 渲染后可见文字的逐行指纹(squash 过)。去掉 import/export、图片、链接地址、组件标签、花括号表达式;
 * 组件的 caption/title 属性(Figure 图注、Callout 标题)会渲染成可见文字,单独保留;代码块内容原样保留。
 */
export function visibleLines(mdx) {
  const code = [];
  const prose = mdx.replace(/^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\s*$/gm, (_, _f, body) => { code.push(body); return '\n'; });
  const attrs = [...prose.matchAll(/\b(?:caption|title)=(["'])([\s\S]*?)\1/g)].map((m) => m[2]);
  // 行内代码原样显示(里面的 <x>、{x} 也是可见文字),先换成占位符;URL 里的符号和正文标点一样会被抹掉,
  // 但整段代码内容(含符号)保留,和线上 <code> 的 squashCode 对齐。
  const inline = [];
  const cleaned = prose
    .replace(/`([^`\n]+)`/g, (_, c) => `\u0000${inline.push(c) - 1}\u0000`)
    .replace(/^\s*(?:import|export)\s.*$/gm, '')
    .replace(/^[ \t>]*(?:[-*+]|\d+[.)])[ \t]+/gm, '') // 列表序号由 <ol> 渲染,不在文字里
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m) => decode(m)); // 正文里的 &amp; 渲染成 &,代码里的不解码
  // fenced 代码块的内容也换成占位符,和行内代码走同一套 squashCode(保留 &&、<、= 等符号)。
  const codeParts = code.map((b) => b.split('\n').map((l) => `\u0000${inline.push(l) - 1}\u0000`).join('\n'));
  return [cleaned, ...attrs, ...codeParts].join('\n').split('\n').map((line) => {
    // 行内/代码块占位符里的内容保留可见符号(含 <x>、{x}),普通正文仍去空白标点。
    const masked = [];
    const body = line.replace(/\u0000(\d+)\u0000/g, (m, i) => `\u0001${masked.push(inline[Number(i)]) - 1}\u0001`);
    return squash(body).replace(/\u0001(\d+)\u0001/g, (_, i) => squashCode(masked[Number(i)]));
  }).filter((s) => [...s].length >= MIN_LINE);
}

const bodyLines = (n) => visibleLines(n.body).filter((s) => [...s].length >= MIN_LINE);
const noteLines = (n) => [squash(n.title), squash(n.description), squash(n.seoTitle), squash(n.seoDescription), ...bodyLines(n)].filter((s) => [...s].length >= MIN_LINE);
const longestFirst = (xs) => [...new Set(xs)].sort((a, b) => [...b].length - [...a].length);

const sourceKey = (n) => {
  // 只忽略空白和代码块外的标点;代码块里的 < { = 等符号有实际意义,用占位符保护。
  const code = [];
  const masked = n.body.replace(/^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\s*$/gm, (_, _f, b) => `\u0000${code.push(b) - 1}\u0000`)
    .replace(/`([^`\n]+)`/g, (_, c) => `\u0000${code.push(c) - 1}\u0000`);
  // 正文去标点,但数字前的正负号、数字之间的小数点是内容(1.5 → -1.5 必须算改动),先占位保护。
  const prose = restoreNums(masked.replace(/(^|[^+\-\d.])([+-])(?=\d)/g, (_, pre, sign) => `${pre}\u0002${sign === '+' ? 'P' : 'M'}\u0002`)
    .replace(/(\d)\.(\d)/g, '$1\u0003$2')
    .replace(/[\p{P}\p{S}]+/gu, ''));
  // 代码片段之间保留分隔符,避免 `1` `23` 和 `12` `3` 拼出同一个 key。
  return JSON.stringify([squash(n.title), squash(n.description), squash(n.seoTitle), squash(n.seoDescription), prose.replace(/\s+/g, ''), code.map((c) => c.replace(/\r\n/g, '\n')), n.draft]);
};

/**
 * 和旧版本比内容有没有变、变了哪些可见行。changed 按整篇源文(标题+描述+正文)判断(只忽略空白,不忽略代码符号),
 * 组件属性里的表格单元格这类提取不到的改动也算;added/removed 是能在线上页里核对的可见行。
 * 新笔记(before 为 null)全部算新增。
 */
export function contentDiff(now, before) {
  const nowL = noteLines(now);
  if (!before) return { changed: true, added: longestFirst(nowL), removed: [] };
  const oldL = noteLines(before);
  const oldSet = new Set(oldL); const nowSet = new Set(nowL);
  const changed = sourceKey(now) !== sourceKey(before);
  const oldAll = oldL.join(''); const nowAll = nowL.join('');
  return {
    changed,
    // 新增行必须在旧版整篇里找不到(不是旧版任何一行的子串),否则旧页面也能匹配上,不算证据。
    added: changed ? longestFirst(nowL.filter((l) => !oldAll.includes(l))) : [],
    removed: changed ? longestFirst(oldL.filter((l) => !nowAll.includes(l))) : [],
  };
}

/**
 * 改动文件 → 候选笔记。只看 site/src/content/notes 下的 mdx;其余文件(页面、布局、_redirects、sitemap)都不推。
 * 现在已发布、并且(新发布 或 标题/描述/正文有改动)才算候选。下线、草稿、只改空白或标点都不推。
 * meta(file) 返回 { now, before },每侧是 parseNote 的结果或 null。
 */
export function candidatesForChanges(files, { meta }) {
  const out = [];
  for (const f of files) {
    const m = f.match(/^site\/src\/content\/notes\/(en\/)?([^/]+)\.mdx$/);
    if (!m) continue;
    const { now, before } = meta(f);
    if (!now || now.draft) continue;
    const wasPublished = Boolean(before && !before.draft);
    const { changed, added, removed } = contentDiff(now, wasPublished ? before : null);
    if (!changed) continue; // 只改了空白、标点或 frontmatter 里不显示的字段
    out.push({ path: `${m[1] ? '/en' : ''}/notes/${m[2]}/`, kind: wasPublished ? 'changed' : 'new', fingerprints: { added: added.slice(0, 5), removed: removed.slice(0, 5) } });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#'
  ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
  : NAMED[e.toLowerCase()] ?? m));
/** 页面可见文字 + meta 的 content(描述只出现在 meta 里),squash 过。 */
export const pageText = (html) => {
  const metaContent = [...html.matchAll(/<meta\b[^>]*\bcontent=("([^"]*)"|'([^']*)')/gi)].map((m) => m[2] ?? m[3] ?? '').join(' ');
  // 去掉 CTA、相关笔记、页脚等页面框架,只保留 <main> 里的正文和 meta 描述。
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  // <code> 里的符号(&&、<、=)是有意义的可见文字,先换成占位符,squash 时只去空白,和普通正文分开处理。
  const codes = [];
  const cleaned = main
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(?:nav|footer|header)\b[^>]*>[\s\S]*?<\/(?:nav|footer|header)>/gi, ' ')
    .replace(/<aside\b[^>]*class=["'][^"']*bz-art__cta[^"']*["'][^>]*>[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => ` ${String.fromCharCode(0xE000)}${codes.push(c.replace(/<[^>]+>/g, '')) - 1} `)
    .replace(/<[^>]+>/g, ' ');
  // 整段解码后再把占位符还原成 <code> 原始内容,避免 &amp; 被解两次。
  const flat = decode(`${cleaned} ${metaContent}`).replace(/\uE000(\d+) ?/g, (_, i) => `\uE000${codes[Number(i)]}\uE000`);
  const kept = [];
  const masked = flat.replace(/\uE000([\s\S]*?)\uE000/g, (_, c) => `\uE001${kept.push(decode(c)) - 1}\uE001`);
  return squash(masked).replace(/\uE001(\d+)\uE001/g, (_, i) => squashCode(kept[Number(i)]));
};

/**
 * 抓线上页确认能交:直接 200、非 noindex、有 canonical 且指向自己,并且线上已是新内容:
 * 找到一条只在新增里出现的文字,或一条已消失的旧文字,才算新版;两条证据都没有时只看部署已到位。fp 为 null 时不比内容(手动模式)。
 */
export async function checkLive(url, fp, { fetchImpl = fetch, retries = 2, waitMs = 30_000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url, { redirect: 'manual', cache: 'no-store', headers: { 'user-agent': 'fxai-indexnow-check' } }).catch((e) => ({ status: 0, err: e }));
    if (res.status !== 200) return { ok: false, reason: `HTTP ${res.status || 'error'}` };
    const html = await res.text();
    const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
    if (metas.some((t) => /\bname=["']?(?:robots|bingbot)\b/i.test(t) && /\bcontent=["'][^"']*\b(?:noindex|none)\b/i.test(t))) return { ok: false, reason: 'noindex' };
    const canonTag = (html.match(/<link\b[^>]*>/gi) ?? []).find((t) => /\brel=["']?canonical\b/i.test(t));
    const canon = canonTag?.match(/\bhref=["']([^"']+)/i)?.[1];
    if (!canon) return { ok: false, reason: 'no canonical' };
    if (new URL(canon, url).href !== url) return { ok: false, reason: `canonical is ${canon}` };
    if (!fp) return { ok: true };
    const text = pageText(html);
    // 能证明「这是新版」的证据:找到一行新增、且旧版里找不到它;或者有一行被删掉的文字已经不在页面上。
    // 只删短、新增行是旧行的子串时,added 证据失效,就靠 removed。都没有(比如只改表格单元格)时以部署已到位为准。
    const fresh = (fp.added.length || fp.removed.length)
      ? (fp.added.some((l) => text.includes(l) && !fp.removed.some((r) => r.includes(l))) || fp.removed.some((l) => !text.includes(l)))
      : true; // 没有可核对的可见行(例如只改表格组件单元格),build.txt 已证明这次提交上线了
    if (fresh) return { ok: true };
    if (attempt >= retries) return { ok: false, reason: 'live page does not show the new content yet' };
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

/** 逐个检查候选,返回 { submit: [url], skipped: [{url, reason}] }。超过 MAX_PER_RUN 篇只交前 MAX_PER_RUN 篇(候选已按路径排序),其余记入 skipped。 */
export async function plan(cands, opts = {}) {
  const skipped = cands.slice(MAX_PER_RUN).map((c) => ({ url: new URL(c.path, SITE).href, reason: `over the ${MAX_PER_RUN}-per-run cap; not submitted this run (resubmit manually if needed)` }));
  const submit = [];
  for (const c of cands.slice(0, MAX_PER_RUN)) {
    const url = new URL(c.path, SITE).href;
    if (!isNotePath(c.path)) { skipped.push({ url, reason: 'not a single note page' }); continue; }
    const r = await checkLive(url, c.fingerprints ?? null, opts);
    if (r.ok) submit.push(url); else skipped.push({ url, reason: r.reason });
  }
  return { submit, skipped };
}

/** 一篇一次请求。 */
export async function submitOne(url, key, { fetchImpl = fetch } = {}) {
  const body = { host: new URL(SITE).host, key, keyLocation: `${SITE}/${key}.txt`, urlList: [url] };
  const res = await fetchImpl(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  return { status: res.status, text: await res.text() };
}

// 在仓库根目录跑 git,改动文件路径统一是 site/... 形式。
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', cwd: `${siteDir}..` }).trim();
// 文件在某个提交里不存在是正常情况(新建/删除),不把 git 的报错打到终端。
const gitShow = (spec) => execFileSync('git', ['show', spec], { encoding: 'utf8', cwd: `${siteDir}..`, stdio: ['ignore', 'pipe', 'ignore'] });
const noteAt = (sha, file) => { try { return parseNote(gitShow(`${sha}:${file}`)); } catch { return null; } };

function isAncestor(sha, live) {
  try {
    try { git('cat-file', '-e', `${live}^{commit}`); } catch { git('fetch', '--quiet', 'origin', live); }
    git('merge-base', '--is-ancestor', sha, live);
    return true;
  } catch {
    return false;
  }
}

async function waitForDeploy(sha, { timeoutMs = 20 * 60_000, everyMs = 20_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${SITE}/build.txt`, { cache: 'no-store' }).catch(() => null);
    const live = res?.ok ? (await res.text()).trim() : '';
    if (live === sha) return;
    // 线上已经是更新的提交(后一次 push 先部署完了):它包含本次改动,也算到位。
    if (/^[0-9a-f]{40}$/.test(live) && isAncestor(sha, live)) return;
    console.log(`waiting for deploy of ${sha.slice(0, 7)} (live: ${live.slice(0, 7) || 'n/a'})`);
    await new Promise((r) => setTimeout(r, everyMs));
  }
  throw new Error(`deploy of ${sha} not live after ${timeoutMs / 60_000} min`);
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const dryRun = argv.includes('--dry-run');
  if (argv.includes('--all-changes') || argv.includes('--sitemap')) throw new Error('bulk/sitemap submission was removed (11/5 Bing plan): only single note pages are submitted');
  const key = indexNowKey();
  let cands;
  if (opt('--urls') !== undefined) {
    // 手动补交:只收单篇笔记页,线上 200 等检查照做(无法比对改动,不查指纹)。
    cands = opt('--urls').split(/\s+/).filter(Boolean).map((p) => ({ path: new URL(p, SITE).pathname, fingerprints: null }));
  } else {
    const from = opt('--from'); const to = opt('--to') ?? git('rev-parse', 'HEAD');
    if (!from || /^0+$/.test(from)) throw new Error('--from <sha> is required');
    const files = git('diff', '--name-only', from, to, '--', 'site/src/content/notes/').split('\n').filter(Boolean);
    cands = candidatesForChanges(files, { meta: (f) => ({ now: noteAt(to, f), before: noteAt(from, f) }) });
    if (!dryRun && cands.length) await waitForDeploy(to);
  }
  const { submit, skipped } = await plan(cands);
  for (const s of skipped) console.log(`skip ${s.url}: ${s.reason}`);
  console.log(`${submit.length} URL(s) to submit:\n${submit.join('\n')}`);
  if (dryRun) return;
  let failed = 0;
  for (const url of submit) {
    const r = await submitOne(url, key);
    console.log(`IndexNow ${url} -> ${r.status} ${r.text}`);
    // 200 已接收;202 已接收、key 待校验。其余(400/403/422/429)都当失败,让 Actions 标红。
    if (r.status !== 200 && r.status !== 202) failed++;
  }
  if (failed) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
