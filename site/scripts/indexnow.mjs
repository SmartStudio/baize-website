// 部署上线后把本次 push 改动的页面推给 IndexNow(Bing、Yandex 等共用,api.indexnow.org 会转发)。
// 由 .github/workflows/indexnow.yml 在 push 到 master 后调用;也可以本地手动跑:
//   node scripts/indexnow.mjs --from <sha> --to <sha> [--dry-run]
//   node scripts/indexnow.mjs --urls "/notes/a/ /notes/b/" [--dry-run]
// 流程:git diff 出改动文件 → 映射成线上 URL → 轮询 /build.txt 等 CF Pages 部署到 --to 这个提交 → POST。
// 密钥是公开的(IndexNow 的设计就是把 key 文件放在站点根目录供校验),不是机密;它就是 public/<key>.txt。
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://fxai.ai';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const PAGES = ['about', 'contact', 'method', 'services'];
const CATEGORY_SLUGS = {
  AI普及: 'ai-basics', AI编程: 'ai-coding', 企业落地: 'enterprise', 安全可信: 'trust-safety', Loop与方法论: 'loop-method', 案例复盘: 'case-study',
};

const siteDir = fileURLToPath(new URL('..', import.meta.url));

export function indexNowKey(publicDir = `${siteDir}public`) {
  const files = readdirSync(publicDir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (files.length !== 1) throw new Error(`expected exactly one IndexNow key file in public/, found ${files.length}`);
  return files[0].slice(0, -4);
}

const parseFm = (text) => {
  const fm = text.split(/^---$/m)[1] ?? '';
  return { draft: /^draft:\s*true/m.test(fm), category: fm.match(/^category:\s*['"]?([^'"\n]+)/m)?.[1]?.trim() };
};

/**
 * 笔记现在和改动前的 frontmatter(category、draft)。文件在某一侧不存在时那一侧为 null。
 * 改动前一侧用 git show 读;没给 from(手动 --urls 模式不会走到这里)时只看现在。
 */
function noteMetaAt(from) {
  return (file) => {
    const p = `${siteDir}${file.replace(/^site\//, '')}`;
    const now = existsSync(p) ? parseFm(readFileSync(p, 'utf8')) : null;
    let before = null;
    if (from) {
      try { before = parseFm(git('show', `${from}:${file}`)); } catch { before = null; }
    }
    return { now, before };
  };
}

/**
 * 改动文件(相对仓库根,如 site/src/content/notes/x.mdx)→ 站内路径列表。
 * 只映射能确定落在哪一页的文件;布局、样式这类全站改动不推,免得每次都把整站推一遍。
 * redirectLines 是 _redirects 里新增/删除的行,源地址也推,让搜索引擎早点看到 301。
 */
export function pathsForChanges(files, { meta = noteMetaAt(null), redirectLines = [] } = {}) {
  const out = new Set();
  for (const f of files) {
    let m;
    if ((m = f.match(/^site\/src\/content\/notes\/(en\/)?([^/]+)\.mdx$/))) {
      const en = m[1] ? '/en' : '';
      const { now, before } = meta(f);
      // 前后都不是已发布状态(新建草稿、草稿改草稿)就不推;从已发布改成草稿或删掉的要推,让搜索引擎看到 404。
      const published = (x) => x && !x.draft;
      if (!published(now) && !published(before)) continue;
      const info = now ?? before;
      out.add(`${en}/notes/${m[2]}/`);
      out.add(`${en}/notes/`);
      out.add(`${en}/`);
      const cat = info?.category && CATEGORY_SLUGS[info.category];
      if (cat) out.add(`${en}/notes/category/${cat}/`);
    } else if ((m = f.match(/^site\/src\/pages\/fxai\/(privacy|terms)(\/en)?\.mdx$/))) {
      out.add(`/fxai/${m[1]}/${m[2] ? 'en/' : ''}`);
    } else if ((m = f.match(/^site\/src\/(?:i18n\/([a-z]+)\.ts|pages\/(?:en\/)?([a-z]+)\.astro|components\/pages\/([A-Za-z]+)\.astro)$/))) {
      const name = (m[1] ?? m[2] ?? m[3]).toLowerCase();
      if (name === 'home' || name === 'index') out.add('/').add('/en/');
      else if (PAGES.includes(name)) out.add(`/${name}/`).add(`/en/${name}/`);
      else if (name === 'notesindex') out.add('/notes/').add('/en/notes/');
    }
  }
  for (const line of redirectLines) {
    const src = line.trim().split(/\s+/)[0];
    if (src?.startsWith('/') && src.endsWith('/')) out.add(src);
  }
  return [...out].sort();
}

// 在仓库根目录跑 git,改动文件路径统一是 site/... 形式。
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', cwd: `${siteDir}..` }).trim();

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
  const key = indexNowKey();
  let paths;
  if (opt('--urls')) {
    paths = opt('--urls').split(/\s+/).filter(Boolean);
  } else {
    const from = opt('--from'); const to = opt('--to') ?? git('rev-parse', 'HEAD');
    if (!from || /^0+$/.test(from)) throw new Error('--from <sha> is required');
    const files = git('diff', '--name-only', from, to, '--', 'site/').split('\n').filter(Boolean);
    const redirectLines = git('diff', '-U0', from, to, '--', 'site/public/_redirects')
      .split('\n').filter((l) => /^[+-]\//.test(l)).map((l) => l.slice(1));
    paths = pathsForChanges(files, { meta: noteMetaAt(from), redirectLines });
    if (!dryRun && paths.length) await waitForDeploy(to);
  }
  const urlList = paths.map((p) => new URL(p, SITE).href);
  console.log(`${urlList.length} URL(s):\n${urlList.join('\n')}`);
  if (!urlList.length || dryRun) return;
  const body = { host: new URL(SITE).host, key, keyLocation: `${SITE}/${key}.txt`, urlList };
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  console.log(`IndexNow responded ${res.status} ${await res.text()}`);
  // 200 已接收;202 已接收、key 待校验。其余(400/403/422/429)都当失败,让 Actions 标红。
  if (res.status !== 200 && res.status !== 202) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
