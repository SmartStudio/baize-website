import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatPointer, objectKey, openRemote, parsePointer, pull, push, status } from './media.mjs';

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

let root;
let bucket;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'media-test-'));
  bucket = join(root, 'bucket');
  mkdirSync(bucket);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

// 一个「检出」= 一个 media 目录。cacheDir 不给就是 CI 的情形(不缓存)。
function checkout(name, { cacheDir = null } = {}) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  return { dir, remote: openRemote(pathToFileURL(bucket).href), cacheDir };
}
// 模拟 git:把指针从一个检出带到另一个检出(真文件不跟着走)。
function carryPointers(from, to) {
  for (const f of readdirSync(from.dir).filter((n) => n.endsWith('.r2'))) copyFileSync(join(from.dir, f), join(to.dir, f));
}

describe('media pointers', () => {
  it('指针往返', () => {
    const ptr = { sha: sha256('x'), size: 1 };
    expect(parsePointer(formatPointer(ptr))).toEqual(ptr);
  });
  it('拒绝不是指针的内容', () => {
    expect(() => parsePointer('\x89PNG\r\n')).toThrow();
    expect(() => parsePointer('sha256 abc\nsize 1\n')).toThrow();
  });
  it('对象 key 按内容寻址,保留扩展名', () => {
    expect(objectKey('Foo-Cover.PNG', 'ab12')).toBe('notes/ab12.png');
  });
});

describe('media push / pull', () => {
  it('push 上传新图并写指针,再 push 一次什么都不做', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one-cover.png'), 'cover-bytes');
    const first = await push(a);
    expect(first).toMatchObject({ pushed: ['one-cover.png'], failed: [] });
    expect(parsePointer(readFileSync(join(a.dir, 'one-cover.png.r2'), 'utf8'))).toEqual({ sha: sha256('cover-bytes'), size: 11 });
    expect(readFileSync(join(bucket, objectKey('one-cover.png', sha256('cover-bytes'))), 'utf8')).toBe('cover-bytes');
    expect((await push(a)).pushed).toEqual([]);
  });

  it('只有指针的检出(CI)pull 回来的文件逐字节一致', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one-cover.png'), 'cover-bytes');
    writeFileSync(join(a.dir, 'one-fig.png'), 'figure-bytes!');
    await push(a);
    const ci = checkout('ci');
    carryPointers(a, ci);
    expect(await pull(ci)).toMatchObject({ ok: 0, downloaded: 2, cached: 0, failed: [], unpushed: [] });
    expect(readFileSync(join(ci.dir, 'one-cover.png'), 'utf8')).toBe('cover-bytes');
    expect(readFileSync(join(ci.dir, 'one-fig.png'), 'utf8')).toBe('figure-bytes!');
    expect(await pull(ci)).toMatchObject({ ok: 2, downloaded: 0 });
  });

  it('R2 上没有对象时 pull 报出文件名,不留半截文件', async () => {
    const ci = checkout('ci');
    writeFileSync(join(ci.dir, 'ghost.png.r2'), formatPointer({ sha: sha256('never uploaded'), size: 14 }));
    const r = await pull(ci);
    expect(r.failed.map((f) => f.name)).toEqual(['ghost.png']);
    expect(readdirSync(ci.dir).sort()).toEqual(['.media-state.json', 'ghost.png.r2']);
  });

  it('对象内容与指针对不上时拒收', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one.png'), 'good-bytes');
    await push(a);
    writeFileSync(join(bucket, objectKey('one.png', sha256('good-bytes'))), 'evil-bytes');
    const ci = checkout('ci');
    carryPointers(a, ci);
    const r = await pull(ci);
    expect(r.failed[0]).toMatchObject({ name: 'one.png' });
    expect(r.failed[0].reason).toMatch(/sha256/);
    expect(existsSync(join(ci.dir, 'one.png'))).toBe(false);
  });

  it('本地重做了图还没 push:pull 不覆盖,--force 才覆盖', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one.png'), 'v1');
    await push(a);
    writeFileSync(join(a.dir, 'one.png'), 'v2-regenerated');
    const r = await pull(a);
    expect(r).toMatchObject({ downloaded: 0, unpushed: ['one.png'] });
    expect(readFileSync(join(a.dir, 'one.png'), 'utf8')).toBe('v2-regenerated');
    await pull(a, { force: true });
    expect(readFileSync(join(a.dir, 'one.png'), 'utf8')).toBe('v1');
  });

  it('别人更新了指针:本地旧版是干净副本,pull 直接换成新版', async () => {
    const a = checkout('a');
    const b = checkout('b');
    writeFileSync(join(a.dir, 'one.png'), 'v1');
    await push(a);
    carryPointers(a, b);
    await pull(b);
    writeFileSync(join(a.dir, 'one.png'), 'v2-regenerated');
    await push(a);
    carryPointers(a, b);
    expect(await pull(b)).toMatchObject({ downloaded: 1, unpushed: [] });
    expect(readFileSync(join(b.dir, 'one.png'), 'utf8')).toBe('v2-regenerated');
    // 旧对象还在桶里:旧提交照样能构建。
    expect(existsSync(join(bucket, objectKey('one.png', sha256('v1'))))).toBe(true);
  });

  it('切分支留下的图(指针不在了)不会被当成新图再登记;点名才登记', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'other-branch.png'), 'bytes');
    await push(a);
    rmSync(join(a.dir, 'other-branch.png.r2'));
    expect((await status(a)).leftover).toEqual(['other-branch.png']);
    expect((await push(a)).pushed).toEqual([]);
    expect(existsSync(join(a.dir, 'other-branch.png.r2'))).toBe(false);
    expect((await push(a, { names: ['other-branch.png'] })).pushed).toEqual(['other-branch.png']);
  });

  it('共用缓存:第二个 worktree 不走网络', async () => {
    const cacheDir = join(root, 'cache');
    const a = checkout('a', { cacheDir });
    writeFileSync(join(a.dir, 'one.png'), 'bytes');
    await push(a);
    rmSync(bucket, { recursive: true });
    const wt = checkout('wt', { cacheDir });
    carryPointers(a, wt);
    expect(await pull(wt)).toMatchObject({ downloaded: 0, cached: 1, failed: [] });
    expect(readFileSync(join(wt.dir, 'one.png'), 'utf8')).toBe('bytes');
  });

  it('内容相同的两张图共用一个对象:带缓存 pull 只下载一次,不互相踩临时文件', async () => {
    const a = checkout('a');
    const bytes = 'same-bytes'.repeat(200000);
    writeFileSync(join(a.dir, 'x-cover.webp'), bytes);
    writeFileSync(join(a.dir, 'x-copy.webp'), bytes);
    await push(a);
    const wt = checkout('wt', { cacheDir: join(root, 'cache') });
    carryPointers(a, wt);
    expect(await pull(wt)).toMatchObject({ downloaded: 1, cached: 1, failed: [] });
    expect(readFileSync(join(wt.dir, 'x-cover.webp'), 'utf8')).toBe(bytes);
    expect(readFileSync(join(wt.dir, 'x-copy.webp'), 'utf8')).toBe(bytes);
  });

  it('缓存里的对象长度对、内容不对:重新下载,错的内容不落进检出', async () => {
    const cacheDir = join(root, 'cache');
    const a = checkout('a', { cacheDir });
    writeFileSync(join(a.dir, 'one.webp'), 'good-bytes');
    await push(a);
    writeFileSync(join(cacheDir, objectKey('one.webp', sha256('good-bytes'))), 'EVIL-BYTES');
    const wt = checkout('wt', { cacheDir });
    carryPointers(a, wt);
    expect(await pull(wt)).toMatchObject({ downloaded: 1, cached: 0, failed: [] });
    expect(readFileSync(join(wt.dir, 'one.webp'), 'utf8')).toBe('good-bytes');
  });

  it('push 点名的文件不存在:报出来,不当成成功', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'y.webp'), 'bytes');
    const r = await push(a, { names: ['y.png'] });
    expect(r.pushed).toEqual([]);
    expect(r.failed.map((f) => f.name)).toEqual(['y.png']);
    expect(existsSync(join(a.dir, 'y.webp.r2'))).toBe(false);
  });

  it('上传期间文件被改写成等长的别的内容:不写指针', async () => {
    const a = checkout('a');
    const file = join(a.dir, 'one.webp');
    writeFileSync(file, 'old-bytes');
    const real = a.remote;
    a.remote = { ...real, upload: async (key, f) => { await real.upload(key, f); writeFileSync(f, 'NEW-bytes'); } };
    const r = await push(a);
    expect(r.pushed).toEqual([]);
    expect(r.failed.map((f) => f.name)).toEqual(['one.webp']);
    expect(existsSync(`${file}.r2`)).toBe(false);
  });

  it('经 HTTP 公开地址 pull:200 落盘,404 报文件名', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one.png'), 'http-bytes');
    await push(a);
    const server = createServer((req, res) => {
      const file = join(bucket, decodeURIComponent(req.url));
      if (!existsSync(file)) { res.writeHead(404).end(); return; }
      const body = readFileSync(file);
      res.writeHead(200, { 'content-length': body.length }).end(req.method === 'HEAD' ? undefined : body);
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    try {
      const ci = { ...checkout('ci'), remote: openRemote(`http://127.0.0.1:${server.address().port}/`) };
      carryPointers(a, ci);
      writeFileSync(join(ci.dir, 'ghost.png.r2'), formatPointer({ sha: sha256('never uploaded'), size: 14 }));
      const r = await pull(ci);
      expect(r).toMatchObject({ downloaded: 1 });
      expect(r.failed).toEqual([{ name: 'ghost.png', reason: expect.stringMatching(/-> 404$/) }]);
      expect(readFileSync(join(ci.dir, 'one.png'), 'utf8')).toBe('http-bytes');
      expect((await status(ci, { checkRemote: true })).remoteMissing).toEqual(['ghost.png']);
    } finally {
      server.close();
    }
  });

  // 一个按规则回 429 的公开地址:limited(n, req) 返回要带的响应头就限速,返回 null 就正常给文件。
  async function throttledServer(limited) {
    let hits = 0;
    const server = createServer((req, res) => {
      const headers = limited(++hits, req);
      if (headers) { res.writeHead(429, headers).end(); return; }
      const body = readFileSync(join(bucket, decodeURIComponent(req.url)));
      res.writeHead(200, { 'content-length': body.length }).end(body);
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    return { server, base: `http://127.0.0.1:${server.address().port}/`, hits: () => hits };
  }

  it('公开地址限速(429):退避后重试,全部拉回,不算失败', async () => {
    const a = checkout('a');
    for (let i = 0; i < 6; i++) writeFileSync(join(a.dir, `n${i}.webp`), `bytes-${i}`);
    await push(a);
    // 前 20 个请求全部被限速:每个文件各自重试三次(共 18 次)是拉不回来的。
    const { server, base } = await throttledServer((n) => (n <= 20 ? {} : null));
    try {
      const ci = { ...checkout('ci'), remote: openRemote(base, undefined, { rateLimitBaseMs: 5 }) };
      carryPointers(a, ci);
      expect(await pull(ci)).toMatchObject({ downloaded: 6, failed: [] });
      expect(readFileSync(join(ci.dir, 'n3.webp'), 'utf8')).toBe('bytes-3');
      expect(ci.remote.stats.rateLimited).toBe(20);
    } finally {
      server.close();
    }
  });

  it('一直被限速:试够次数后放弃,原因里写明 429,请求数有上限', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one.webp'), 'bytes');
    await push(a);
    const { server, base, hits } = await throttledServer(() => ({}));
    try {
      const ci = { ...checkout('ci'), remote: openRemote(base, undefined, { rateLimitBaseMs: 1 }) };
      carryPointers(a, ci);
      const r = await pull(ci);
      expect(r.failed).toEqual([{ name: 'one.webp', reason: expect.stringMatching(/-> 429, gave up after 8 tries/) }]);
      expect(hits()).toBe(8);
      expect(existsSync(join(ci.dir, 'one.webp'))).toBe(false);
    } finally {
      server.close();
    }
  });

  it('限速响应带 Retry-After:按它给的秒数等', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one.webp'), 'bytes');
    await push(a);
    const { server, base } = await throttledServer((n) => (n === 1 ? { 'retry-after': '2' } : null));
    try {
      const ci = { ...checkout('ci'), remote: openRemote(base, undefined, { rateLimitBaseMs: 1 }) };
      carryPointers(a, ci);
      const started = Date.now();
      expect(await pull(ci)).toMatchObject({ downloaded: 1, failed: [] });
      expect(Date.now() - started).toBeGreaterThanOrEqual(1950);
    } finally {
      server.close();
    }
  });

  it('公开地址连不上:pull 和 status --remote 报出请求和网络原因,不是一句 fetch failed', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'one.webp'), 'bytes');
    await push(a);
    // 起一个服务再关掉,拿到一个确定没人监听的端口。
    const server = createServer(() => {});
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${server.address().port}/`;
    await new Promise((r) => server.close(r));
    const ci = { ...checkout('ci'), remote: openRemote(base) };
    carryPointers(a, ci);
    const [pulled, checked] = await Promise.allSettled([pull(ci), status(ci, { checkRemote: true })]);
    expect(pulled.value.failed).toEqual([{ name: 'one.webp', reason: expect.stringMatching(/^GET http:\/\/127\.0\.0\.1:\d+\/notes\/.+ failed: ECONNREFUSED$/) }]);
    expect(checked.status).toBe('rejected');
    expect(checked.reason.message).toMatch(/^HEAD http:\/\/127\.0\.0\.1:\d+\/notes\/.+ failed: ECONNREFUSED$/);
  });

  it('status 区分新图、改过的图,--remote 查出桶里缺的对象', async () => {
    const a = checkout('a');
    writeFileSync(join(a.dir, 'kept.png'), 'kept');
    writeFileSync(join(a.dir, 'changed.png'), 'v1');
    await push(a);
    writeFileSync(join(a.dir, 'changed.png'), 'v2-longer');
    writeFileSync(join(a.dir, 'brand-new.png'), 'new');
    rmSync(join(bucket, objectKey('kept.png', sha256('kept'))));
    expect(await status(a, { checkRemote: true })).toMatchObject({
      ok: 1, modified: ['changed.png'], untracked: ['brand-new.png'], missing: [], remoteMissing: ['kept.png'],
    });
  });
});
