// pnpm media:pull / media:push / media:status
// 明理笔记的图片(src/content/notes/media/)存在 Cloudflare R2,git 里只留同名的 `.r2` 指针:
//   media/foo-cover.webp      真文件,gitignore,构建前由 pull 拉回
//   media/foo-cover.webp.r2   指针(sha256 + 字节数),进 git
// R2 里的对象按内容寻址(notes/<sha256>.<ext>):同名图片重做会得到新对象,旧提交、别的分支照样能构建,
// 对象本身永不改写,可以放心缓存一年。
//
// pull   让本地文件与指针一致:缺的下载,指针变了的更新;本地改过还没上传的不动(--force 才覆盖)。
// push   先把目录里的 PNG 转成 WebP(media-webp.mjs),再把新增/改过的图片上传到 R2 并写指针。写完要 git add 指针。
// status 列出未上传、缺失的文件;--remote 再逐个确认 R2 上对象存在。有未上传的就以 1 退出。
//
// 环境变量:MEDIA_BASE_URL(公开读地址,也接受 file:///目录 供测试)、MEDIA_BUCKET(上传用的桶名)、
// MEDIA_CACHE_DIR(本机对象缓存;默认放在 git 公共目录下,所有 worktree 共用;设为空串关闭)。
import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  constants, createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync,
  renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

export const POINTER_EXT = '.r2';
const STATE_FILE = '.media-state.json';
// 桶 baize-media 的 r2.dev 公开地址。给桶绑了自定义域名(如 media.fxai.ai)后把这里换掉,对象 key 不变。
const DEFAULT_BASE_URL = 'https://pub-bea947fc4b5f406e81051515af55cc8e.r2.dev';
const DEFAULT_BUCKET = 'baize-media';
const CONTENT_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

export const formatPointer = ({ sha, size }) => `sha256 ${sha}\nsize ${size}\n`;

export function parsePointer(text) {
  const m = text.match(/^sha256 ([0-9a-f]{64})\nsize (\d+)\n?$/);
  if (!m) throw new Error('not a media pointer');
  return { sha: m[1], size: Number(m[2]) };
}

export const objectKey = (name, sha) => `notes/${sha}${extname(name).toLowerCase()}`;

async function hashFile(file) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), hash);
  return hash.digest('hex');
}

async function pool(items, limit, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

async function retry(fn, tries = 3) {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (err) {
      if (i >= tries || err.permanent) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
}

// 公开地址限速(429/503)时每个请求最多发几次。等待依次是 2、4、8、16、30、30、30 秒,合计 2 分钟。
const RATE_LIMIT_TRIES = 8;

// 公开读走 HTTP;上传走 wrangler(用本机 `wrangler login` 的授权,或环境里的 CLOUDFLARE_API_TOKEN)。
// file: 形式把一个本地目录当桶用,测试和离线演练用。
export function openRemote(baseUrl = DEFAULT_BASE_URL, bucket = DEFAULT_BUCKET, { rateLimitBaseMs = 1000 } = {}) {
  const stats = { rateLimited: 0 };
  if (baseUrl.startsWith('file:')) {
    const root = fileURLToPath(baseUrl);
    return {
      name: root,
      stats,
      size: async (key) => (existsSync(join(root, key)) ? statSync(join(root, key)).size : null),
      download: async (key, dest) => {
        if (!existsSync(join(root, key))) throw Object.assign(new Error(`no object ${key} in ${root}`), { permanent: true });
        await copyFile(join(root, key), dest);
      },
      upload: async (key, src) => {
        mkdirSync(dirname(join(root, key)), { recursive: true });
        await copyFile(src, join(root, key));
      },
    };
  }
  const url = (key) => `${baseUrl.replace(/\/$/, '')}/${key}`;
  // r2.dev 对突发请求限速:GitHub 的构建机 12 秒拉完 703 张,剩下 41 个请求全部 429,各自重试三次也没过。
  // 一个请求被限速,所有并发请求停到同一个时刻再发。各等各的,请求一直不断,限速窗口结束不了。
  let pausedUntil = 0;
  const request = async (target, init = {}) => {
    for (let attempt = 1; ; attempt++) {
      const wait = pausedUntil - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const res = await fetch(target, init);
      if (res.status !== 429 && res.status !== 503) return res;
      await res.body?.cancel();
      stats.rateLimited++;
      if (attempt >= RATE_LIMIT_TRIES) {
        // 已经等满了,外层 retry 不必再整轮重来。
        throw Object.assign(new Error(`${init.method ?? 'GET'} ${target} -> ${res.status}, gave up after ${attempt} tries`), { permanent: true });
      }
      const after = Number(res.headers.get('retry-after'));
      const delay = after > 0 ? Math.min(after, 60) * 1000 : Math.min(2 ** attempt, 30) * rateLimitBaseMs;
      pausedUntil = Math.max(pausedUntil, Date.now() + delay);
    }
  };
  return {
    name: baseUrl,
    stats,
    size: async (key) => {
      const res = await request(url(key), { method: 'HEAD' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HEAD ${url(key)} -> ${res.status}`);
      return Number(res.headers.get('content-length'));
    },
    download: async (key, dest) => {
      const res = await request(url(key));
      // 404 重试也不会有:对象没上传。其他状态码和网络错误才重试。
      if (!res.ok) throw Object.assign(new Error(`GET ${url(key)} -> ${res.status}`), { permanent: res.status === 404 });
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    },
    upload: async (key, src) => {
      try {
        await promisify(execFile)('npx', [
          '--yes', 'wrangler', 'r2', 'object', 'put', `${bucket}/${key}`, '--remote', '--file', src,
          '--content-type', CONTENT_TYPES[extname(key)] ?? 'application/octet-stream',
          '--cache-control', 'public, max-age=31536000, immutable',
        ], { maxBuffer: 16 * 1024 * 1024 });
      } catch (err) {
        // execFile 的 message 是整条命令行;真正的原因在 wrangler 输出的最后几行。
        const out = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.split('\n').map((l) => l.trim()).filter(Boolean);
        throw new Error(`wrangler r2 object put failed: ${out.slice(-3).join(' | ') || err.message}`);
      }
    },
  };
}

// 所有 worktree 共用一份对象缓存(像 .git/lfs/objects):新开 worktree 不用重新下载。CI 上每次都是新机器,不缓存。
export function defaultCacheDir(cwd) {
  if (process.env.MEDIA_CACHE_DIR !== undefined) return process.env.MEDIA_CACHE_DIR || null;
  if (process.env.CI || process.env.CF_PAGES) return null;
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return join(resolve(cwd, common), 'media-cache');
  } catch {
    return null;
  }
}

// 状态文件记每个本地文件上次算出的 sha(靠 size + mtime 判断没变,省掉重复哈希),
// 以及它上次与 R2 对齐时的 sha(synced)。后者用来区分「指针变了、本地是旧版干净副本」和「本地改过还没上传」。
const loadState = (dir) => {
  try { return JSON.parse(readFileSync(join(dir, STATE_FILE), 'utf8')); } catch { return {}; }
};
const saveState = (dir, state) => writeFileSync(join(dir, STATE_FILE), JSON.stringify(state));

async function currentSha(dir, name, state) {
  const st = statSync(join(dir, name));
  const known = state[name];
  if (known && known.size === st.size && known.mtimeMs === st.mtimeMs) return known.sha;
  const sha = await hashFile(join(dir, name));
  state[name] = { size: st.size, mtimeMs: st.mtimeMs, sha, synced: known?.synced };
  return sha;
}

function markSynced(dir, name, sha, state) {
  const st = statSync(join(dir, name));
  state[name] = { size: st.size, mtimeMs: st.mtimeMs, sha, synced: sha };
}

// 每个名字的状态:
//   ok        本地文件与指针一致
//   missing   有指针没文件 -> pull 下载
//   outdated  本地是旧版的干净副本,指针已指向新版 -> pull 更新
//   modified  本地与指针不同,且不是已同步过的版本 -> 要 push
//   untracked 有文件没指针,从没同步过 -> 新图,要 push
//   leftover  有文件没指针,但它是同步过的版本(切分支留下的别的分支的图)-> 不管
export async function inspect(dir, state) {
  const pointers = new Map();
  const files = new Set();
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile() || e.name.startsWith('.') || e.name.endsWith('.part')) continue;
    if (!e.name.endsWith(POINTER_EXT)) { files.add(e.name); continue; }
    try {
      pointers.set(e.name.slice(0, -POINTER_EXT.length), parsePointer(readFileSync(join(dir, e.name), 'utf8')));
    } catch {
      throw new Error(`${e.name}: not a media pointer (expected "sha256 <hex>\\nsize <bytes>")`);
    }
  }
  const items = [];
  for (const name of [...new Set([...pointers.keys(), ...files])].sort()) {
    const ptr = pointers.get(name);
    if (!files.has(name)) { items.push({ name, ptr, status: 'missing' }); continue; }
    const sha = await currentSha(dir, name, state);
    const wasSynced = state[name].synced === sha;
    let status;
    if (!ptr) status = wasSynced ? 'leftover' : 'untracked';
    else if (sha === ptr.sha) status = 'ok';
    else status = wasSynced ? 'outdated' : 'modified';
    if (status === 'ok') state[name].synced = sha;
    items.push({ name, ptr, sha, size: state[name].size, status });
  }
  return items;
}

async function downloadVerified(remote, key, dest, ptr) {
  // 两个 worktree 可能同时往共用缓存里下同一个对象,临时文件名带上进程号。
  const part = `${dest}.${process.pid}.part`;
  try {
    await retry(() => remote.download(key, part));
    const size = statSync(part).size;
    if (size !== ptr.size) throw new Error(`size ${size}, pointer says ${ptr.size}`);
    const sha = await hashFile(part);
    if (sha !== ptr.sha) throw new Error(`sha256 ${sha.slice(0, 12)}…, pointer says ${ptr.sha.slice(0, 12)}…`);
    renameSync(part, dest);
  } catch (err) {
    rmSync(part, { force: true });
    throw err;
  }
}

// 内容相同的两个文件名指向同一个缓存对象;同一次 pull 里只下载一次,否则两个下载会抢同一个临时文件。
const fetching = new Map();

async function materialize({ dir, remote, cacheDir }, name, ptr) {
  const key = objectKey(name, ptr.sha);
  const dest = join(dir, name);
  if (!cacheDir) { await downloadVerified(remote, key, dest, ptr); return 'downloaded'; }
  const cached = join(cacheDir, key);
  let how = 'cached';
  // 缓存里的对象也核对 sha:长度对、内容不对的(磁盘损坏、被人改过)当作没命中。
  if (!(existsSync(cached) && statSync(cached).size === ptr.size && await hashFile(cached) === ptr.sha)) {
    if (!fetching.has(cached)) {
      mkdirSync(dirname(cached), { recursive: true });
      fetching.set(cached, downloadVerified(remote, key, cached, ptr).finally(() => fetching.delete(cached)));
      how = 'downloaded';
    }
    await fetching.get(cached);
  }
  // APFS 等支持写时复制的文件系统上这是零拷贝克隆,缓存不额外占盘。
  const part = `${dest}.${process.pid}.part`;
  await copyFile(cached, part, constants.COPYFILE_FICLONE);
  renameSync(part, dest);
  return how;
}

export async function pull(ctx, { force = false } = {}) {
  const state = loadState(ctx.dir);
  const items = await inspect(ctx.dir, state);
  const wanted = items.filter((i) => i.status === 'missing' || i.status === 'outdated' || (force && i.status === 'modified'));
  const result = { ok: items.filter((i) => i.status === 'ok').length, downloaded: 0, cached: 0, failed: [] };
  await pool(wanted, 16, async (item) => {
    try {
      result[await materialize(ctx, item.name, item.ptr)]++;
      markSynced(ctx.dir, item.name, item.ptr.sha, state);
    } catch (err) {
      result.failed.push({ name: item.name, reason: err.message });
    }
  });
  saveState(ctx.dir, state);
  result.unpushed = items.filter((i) => i.status === 'untracked' || (!force && i.status === 'modified')).map((i) => i.name);
  return result;
}

// 不带名字:上传所有新图和改过的图。带名字:只处理这几个,并且 leftover 也照传
// (指针被撤销后想重新登记同一张图时用)。
export async function push(ctx, { names = [] } = {}) {
  const state = loadState(ctx.dir);
  const items = await inspect(ctx.dir, state);
  const wanted = items.filter((i) => (names.length
    ? names.includes(i.name) && ['untracked', 'modified', 'leftover'].includes(i.status)
    : i.status === 'untracked' || i.status === 'modified'));
  const result = { pushed: [], failed: [], skipped: [] };
  for (const name of names) {
    if (!items.some((i) => i.name === name)) result.failed.push({ name, reason: 'no such file in the media directory' });
  }
  await pool(wanted, 4, async (item) => {
    // 一个都没传成功就连着失败,多半是没登录或桶不存在,不必把几百个文件挨个试一遍。
    if (!result.pushed.length && result.failed.length >= 4) { result.skipped.push(item.name); return; }
    const key = objectKey(item.name, item.sha);
    const file = join(ctx.dir, item.name);
    try {
      await ctx.remote.upload(key, file);
      // 上传期间文件被别的进程改写的话,桶里这个 key 下的内容对不上 sha:不写指针,重跑即可。
      if (await hashFile(file) !== item.sha) throw new Error('file changed during upload, run media:push again');
      // 上传后从公开地址读回字节数再写指针:指针一旦进 git,构建就靠这个地址取图。
      await retry(async () => {
        const size = await ctx.remote.size(key);
        if (size !== item.size) throw new Error(`uploaded ${item.size} bytes but ${ctx.remote.name} reports ${size}`);
      });
      if (ctx.cacheDir) {
        const cached = join(ctx.cacheDir, key);
        mkdirSync(dirname(cached), { recursive: true });
        await copyFile(file, cached, constants.COPYFILE_FICLONE);
      }
      writeFileSync(`${file}${POINTER_EXT}`, formatPointer({ sha: item.sha, size: item.size }));
      state[item.name].synced = item.sha;
      result.pushed.push(item.name);
    } catch (err) {
      result.failed.push({ name: item.name, reason: err.message });
    }
  });
  saveState(ctx.dir, state);
  return result;
}

export async function status(ctx, { checkRemote = false } = {}) {
  const state = loadState(ctx.dir);
  const items = await inspect(ctx.dir, state);
  saveState(ctx.dir, state);
  const by = (s) => items.filter((i) => i.status === s).map((i) => i.name);
  const result = {
    ok: by('ok').length, missing: by('missing'), outdated: by('outdated'), modified: by('modified'),
    untracked: by('untracked'), leftover: by('leftover'), remoteMissing: [],
  };
  if (checkRemote) {
    await pool(items.filter((i) => i.ptr), 16, async (item) => {
      const size = await retry(() => ctx.remote.size(objectKey(item.name, item.ptr.sha)));
      if (size !== item.ptr.size) result.remoteMissing.push(item.name);
    });
    result.remoteMissing.sort();
  }
  return result;
}

const list = (names) => (names.length > 8 ? `${names.slice(0, 8).join(', ')} … (${names.length})` : names.join(', '));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter((a) => a.startsWith('--')));
  const names = rest.filter((a) => !a.startsWith('--'));
  const dir = fileURLToPath(new URL('../src/content/notes/media/', import.meta.url));
  const ctx = {
    dir,
    remote: openRemote(process.env.MEDIA_BASE_URL, process.env.MEDIA_BUCKET),
    cacheDir: defaultCacheDir(dir),
  };
  let failed = false;
  if (cmd === 'pull') {
    const r = await pull(ctx, { force: flags.has('--force') });
    console.log(`media: ${r.ok + r.downloaded + r.cached} ready (${r.downloaded} downloaded, ${r.cached} from local cache)`);
    if (ctx.remote.stats.rateLimited) console.warn(`media: ${ctx.remote.name} rate-limited ${ctx.remote.stats.rateLimited} request(s); backed off and retried`);
    if (r.unpushed.length) console.warn(`media: not uploaded yet, run \`pnpm media:push\`: ${list(r.unpushed)}`);
    for (const f of r.failed) console.error(`media: ${f.name}: ${f.reason}`);
    if (r.failed.length) console.error(`media: ${r.failed.length} file(s) could not be fetched from ${ctx.remote.name}. If the image is new, its author has not run \`pnpm media:push\`.`);
    failed = r.failed.length > 0;
  } else if (cmd === 'push') {
    // 源图一律存 WebP:先把 PNG 转掉,点名的 foo.png 转完按 foo.webp 上传。sharp 只在这条路径上加载,pull 不依赖它。
    const { convertDir } = await import('./media-webp.mjs');
    const present = names.filter((n) => existsSync(join(dir, n)));
    try {
      const converted = names.length && !present.length ? [] : await convertDir(dir, present);
      if (converted.length) console.log(`media: converted ${converted.length} PNG to WebP`);
    } catch (err) {
      console.error(`media: ${err.message}`);
      process.exit(1);
    }
    const r = await push(ctx, { names: names.map((n) => (present.includes(n) ? n.replace(/\.png$/i, '.webp') : n)) });
    for (const f of r.failed) console.error(`media: ${f.name}: ${f.reason}`);
    if (r.skipped.length) console.error(`media: gave up on ${r.skipped.length} more file(s) after repeated failures`);
    console.log(`media: ${r.pushed.length} uploaded${r.pushed.length ? `, now \`git add\` the ${POINTER_EXT} pointers: ${list(r.pushed)}` : ''}`);
    failed = r.failed.length > 0;
  } else if (cmd === 'status') {
    const r = await status(ctx, { checkRemote: flags.has('--remote') });
    console.log(`media: ${r.ok} ok, ${r.missing.length + r.outdated.length} to pull, ${r.modified.length + r.untracked.length} to push`);
    if (r.modified.length) console.log(`  modified (run media:push): ${list(r.modified)}`);
    if (r.untracked.length) console.log(`  new (run media:push): ${list(r.untracked)}`);
    if (r.missing.length) console.log(`  missing locally (run media:pull): ${list(r.missing)}`);
    if (r.outdated.length) console.log(`  outdated locally (run media:pull): ${list(r.outdated)}`);
    if (r.remoteMissing.length) console.log(`  NOT on ${ctx.remote.name}: ${list(r.remoteMissing)}`);
    failed = r.modified.length + r.untracked.length + r.remoteMissing.length > 0;
  } else {
    console.error('usage: node scripts/media.mjs <pull [--force] | push [name...] | status [--remote]>');
    failed = true;
  }
  process.exit(failed ? 1 : 0);
}
