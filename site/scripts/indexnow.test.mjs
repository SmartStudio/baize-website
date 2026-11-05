import { describe, expect, it, vi } from 'vitest';
import { MAX_PER_RUN, candidatesForChanges, checkLive, contentDiff, indexNowKey, isNotePath, pageText, parseNote, plan, squash, submitOne, visibleLines } from './indexnow.mjs';

const note = (title, body, draft = false) => parseNote(`---\ntitle: ${title}\ndescription: 一段描述文字够长够长够长\ndraft: ${draft}\n---\n\n${body}\n`);
const OLD = note('旧标题旧标题旧标题旧标题', '第一段原来的正文内容，足够长的一句话。\n\n第二段也是原来的正文内容，保持不变的一句话。');
const EDITED = note('旧标题旧标题旧标题旧标题', '第一段改过之后的正文内容，新加了一句很长的话。\n\n第二段也是原来的正文内容，保持不变的一句话。');
const page = (url, text, extra = '') => `<html><head><link rel="canonical" href="${url}">${extra}</head><body><h1>t</h1><p>${text}</p></body></html>`;
const res = (status, body = '') => ({ status, text: async () => body });
const fetchFrom = (map) => vi.fn(async (url) => map[url] ?? res(404, 'not found'));
const fast = { retries: 0 };

describe('isNotePath', () => {
  it('accepts single note pages only', () => {
    expect(isNotePath('/notes/foo-bar/')).toBe(true);
    expect(isNotePath('/en/notes/foo/')).toBe(true);
    for (const p of ['/notes/', '/en/notes/', '/', '/en/', '/notes/category/', '/notes/category/enterprise/', '/sitemap-index.xml', '/services/', '/notes/foo']) {
      expect(isNotePath(p)).toBe(false);
    }
  });
});

describe('visibleLines / contentDiff', () => {
  it('drops imports, images, components and link targets, keeps captions and titles', () => {
    const lines = visibleLines("import x from './media/a.png'\n\n看 [这份报告的链接文字](https://example.com/very/long/path) 再说。\n\n![图片说明文字](./media/a.png)\n\n<Figure\n  src={x}\n  alt=\"图里的说明文字也很长很长\"\n  caption=\"图：图注文字会显示出来\"\n/>\n\n<Callout type=\"warn\" title=\"注意事项标题\">提醒内容文字</Callout>");
    expect(lines.join('|')).not.toMatch(/import|example|Figure|src|图片说明|图里的说明/);
    expect(lines).toEqual(expect.arrayContaining(['看这份报告的链接文字再说', '图图注文字会显示出来', '注意事项标题', '提醒内容文字']));
  });
  it('keeps text inside fenced code blocks', () => {
    const a = parseNote('---\ntitle: t\n---\n```python\nmessages = [{"role": "user", "content": "old prompt"}]\n```\n');
    const b = parseNote('---\ntitle: t\n---\n```python\nmessages = [{"role": "user", "content": "brand new prompt"}]\n```\n');
    expect(contentDiff(b, a)).toEqual({ changed: true, added: ['messages=[{"role":"user","content":"brandnewprompt"}]'], removed: ['messages=[{"role":"user","content":"oldprompt"}]'] });
  });
  it('catches short value corrections and caption / Callout title edits', () => {
    const v = (x) => parseNote(`---\ntitle: t\n---\n| 参数 | 值 |\n|---|---|\n| temperature | ${x} |\n`);
    expect(contentDiff(v('0.6'), v('1.0')).added).toEqual(['temperature0.6']);
    const c = (x) => parseNote(`---\ntitle: t\n---\n<Callout type="warn" title="${x}">正文不变的内容</Callout>`);
    expect(contentDiff(c('新的提醒标题'), c('旧的提醒标题')).added).toEqual(['新的提醒标题']);
  });
  it('decodes entities in prose but not in code', () => {
    expect(visibleLines('Deal with AT&amp;T today, `AT&amp;T` stays')).toEqual(['DealwithATTtodayAT&amp;Tstays']);
  });
  it('keeps inline code literals like <command> and {x}', () => {
    expect(visibleLines('Run `srt "<command>"` then `{x}` here.')).toEqual(['Runsrt"<command>"then{x}here']);
  });
  it('a NoteTable cell edit counts as changed even without checkable lines', () => {
    const t = (x) => parseNote(`---\ntitle: t\n---\n<NoteTable columns={["名称", "说明"]} rows={[["甲", "${x}"]]} />`);
    expect(contentDiff(t('新值'), t('旧值'))).toEqual({ changed: true, added: [], removed: [] });
  });
  it('new note: everything is added; edited note: only the changed lines', () => {
    expect(contentDiff(OLD, null).added.length).toBeGreaterThan(0);
    expect(contentDiff(EDITED, OLD)).toEqual({ changed: true, added: expect.arrayContaining([squash('第一段改过之后的正文内容，新加了一句很长的话。')]), removed: [squash('第一段原来的正文内容，足够长的一句话。')] });
  });
  it('whitespace or punctuation-only edit is not a change', () => {
    const ws = parseNote(`---\ntitle: 旧标题旧标题旧标题旧标题\ndescription: 一段描述文字够长够长够长\ndraft: false\n---\n\n\n第一段原来的正文内容, 足够长的一句话   \n\n\n第二段也是原来的正文内容，保持不变的一句话。\n`);
    expect(contentDiff(ws, OLD)).toEqual({ changed: false, added: [], removed: [] });
  });
});

describe('candidatesForChanges', () => {
  const meta = (f) => ({
    'site/src/content/notes/new-a.mdx': { now: OLD, before: null },
    'site/src/content/notes/en/wasdraft-b.mdx': { now: OLD, before: { ...OLD, draft: true } },
    'site/src/content/notes/edited.mdx': { now: EDITED, before: OLD },
    'site/src/content/notes/same.mdx': { now: OLD, before: OLD },
    'site/src/content/notes/unpub.mdx': { now: { ...OLD, draft: true }, before: OLD },
    'site/src/content/notes/gone.mdx': { now: null, before: OLD },
    'site/src/content/notes/draft-c.mdx': { now: { ...OLD, draft: true }, before: null },
  }[f] ?? { now: OLD, before: null });
  it('keeps new and edited published notes only, never index/home/static pages', () => {
    const c = candidatesForChanges([
      'site/src/content/notes/new-a.mdx', 'site/src/content/notes/en/wasdraft-b.mdx', 'site/src/content/notes/edited.mdx',
      'site/src/content/notes/same.mdx', 'site/src/content/notes/unpub.mdx', 'site/src/content/notes/gone.mdx', 'site/src/content/notes/draft-c.mdx',
      'site/src/i18n/home.ts', 'site/src/components/pages/NotesIndex.astro', 'site/src/pages/fxai/terms.mdx', 'site/public/_redirects',
      'site/src/content/notes/media/new-a-cover.png',
    ], { meta });
    expect(c.map((x) => [x.path, x.kind])).toEqual([
      ['/en/notes/wasdraft-b/', 'new'], ['/notes/edited/', 'changed'], ['/notes/new-a/', 'new'],
    ]);
  });
  it('a zh-only note never yields an /en/ candidate', () => {
    expect(candidatesForChanges(['site/src/content/notes/zh-only.mdx'], { meta }).map((x) => x.path)).toEqual(['/notes/zh-only/']);
  });
});

describe('plan (live checks)', () => {
  const U = 'https://fxai.ai/notes/a/';
  const TEXT = '第一段改过之后的正文内容，新加了一句很长的话。';
  const fp = { added: [squash(TEXT)], removed: [] };
  it('submits a 200 page that shows the new content', async () => {
    const f = fetchFrom({ [U]: res(200, page(U, TEXT)) });
    expect(await plan([{ path: '/notes/a/', fingerprints: fp }], { fetchImpl: f, ...fast })).toEqual({ submit: [U], skipped: [] });
    expect(f).toHaveBeenCalledWith(U, expect.objectContaining({ redirect: 'manual' }));
  });
  it('skips 404, including the /en/ page of a zh-only note', async () => {
    const r = await plan([{ path: '/en/notes/zh-only/', fingerprints: fp }, { path: '/notes/missing/', fingerprints: fp }], { fetchImpl: fetchFrom({}), ...fast });
    expect(r.submit).toEqual([]);
    expect(r.skipped).toEqual([
      { url: 'https://fxai.ai/en/notes/zh-only/', reason: 'HTTP 404' },
      { url: 'https://fxai.ai/notes/missing/', reason: 'HTTP 404' },
    ]);
  });
  it('skips redirects, noindex, foreign canonical and pages still showing old content', async () => {
    const f = fetchFrom({
      'https://fxai.ai/notes/moved/': res(301),
      'https://fxai.ai/notes/hidden/': res(200, page('https://fxai.ai/notes/hidden/', TEXT, '<meta name="robots" content="noindex">')),
      'https://fxai.ai/notes/dup/': res(200, page('https://fxai.ai/notes/other/', TEXT)),
      'https://fxai.ai/notes/stale/': res(200, page('https://fxai.ai/notes/stale/', '第一段原来的正文内容')),
      'https://fxai.ai/notes/hidden2/': res(200, page('https://fxai.ai/notes/hidden2/', TEXT, '<meta content="noindex, follow" name="robots">')),
      'https://fxai.ai/notes/nocanon/': res(200, `<html><body><p>${TEXT}</p></body></html>`),
    });
    const r = await plan(['moved', 'hidden', 'hidden2', 'dup', 'nocanon', 'stale'].map((s) => ({ path: `/notes/${s}/`, fingerprints: fp })), { fetchImpl: f, ...fast });
    expect(r.submit).toEqual([]);
    expect(r.skipped.map((s) => s.reason)).toEqual(['HTTP 301', 'noindex', 'noindex', 'canonical is https://fxai.ai/notes/other/', 'no canonical', 'live page does not show the new content yet']);
  });
  it('never submits index pages, home or sitemap even if they return 200', async () => {
    const f = vi.fn(async (url) => res(200, page(url, 'x')));
    const r = await plan(['/notes/', '/en/notes/', '/', '/sitemap-index.xml', '/notes/category/enterprise/'].map((path) => ({ path, fingerprints: null })), { fetchImpl: f, ...fast });
    expect(r.submit).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
  it('refuses a bulk run', async () => {
    const f = vi.fn();
    const many = Array.from({ length: MAX_PER_RUN + 1 }, (_, i) => ({ path: `/notes/n${i}/`, fingerprints: fp }));
    const r = await plan(many, { fetchImpl: f, ...fast });
    expect(r.submit).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
  it('checkLive decodes entities and ignores tags/typography in highlighted code', async () => {
    const html = page(U, '<pre><code><span>brand&#x20;new</span> <span>prompt&#39;s&nbsp;text</span></code></pre> “引号”…');
    const want = { added: ["brandnewprompt'stext", 'nope'], removed: [] };
    expect(await checkLive(U, want, { fetchImpl: fetchFrom({ [U]: res(200, html) }), ...fast })).toEqual({ ok: true });
  });
  it('checkLive finds a changed description in meta content', async () => {
    const html = page(U, '正文', '<meta name="description" content="新的描述文字内容">');
    expect(await checkLive(U, { added: [squash('新的描述文字内容')], removed: [] }, { fetchImpl: fetchFrom({ [U]: res(200, html) }), ...fast })).toEqual({ ok: true });
  });
  it('shortened paragraph: the old page must not pass', async () => {
    const oldT = 'The request must include an API key and an account ID.';
    const newT = 'The request must include an API key.';
    const d = contentDiff(parseNote(`---\ntitle: t\n---\n${newT}`), parseNote(`---\ntitle: t\n---\n${oldT}`));
    expect(d.added).toEqual([]);
    const f = fetchFrom({ [U]: res(200, page(U, oldT)), 'https://fxai.ai/notes/b/': res(200, page('https://fxai.ai/notes/b/', newT)) });
    expect((await checkLive(U, d, { fetchImpl: f, ...fast })).ok).toBe(false);
    expect((await checkLive('https://fxai.ai/notes/b/', d, { fetchImpl: f, ...fast })).ok).toBe(true);
  });
  it('candidatesForChanges output reaches the freshness gate (stale page is rejected)', async () => {
    const [c] = candidatesForChanges(['site/src/content/notes/a.mdx'], { meta: () => ({ now: EDITED, before: OLD }) });
    const f = fetchFrom({ [U]: res(200, page(U, OLD.body)) });
    expect((await plan([c], { fetchImpl: f, ...fast })).submit).toEqual([]);
    const f2 = fetchFrom({ [U]: res(200, page(U, EDITED.body)) });
    expect((await plan([c], { fetchImpl: f2, ...fast })).submit).toEqual([U]);
  });
  it('operator-only code edits keep freshness evidence on both sides', async () => {
    const v = (op) => parseNote(`---\ntitle: t\n---\n\`\`\`sh\napt update ${op} apt upgrade -y\n\`\`\`\n`);
    const d = contentDiff(v('&&'), v('||'));
    expect(d.changed).toBe(true);
    expect(d.added).toEqual(['aptupdate&&aptupgrade-y']);
    expect(d.removed).toEqual(['aptupdate||aptupgrade-y']);
    const live = (op) => `<html><head><link rel="canonical" href="${U}"></head><body><main><pre><code><span>apt update ${op === '&&' ? '&amp;&amp;' : '||'} apt upgrade -y</span></code></pre></main></body></html>`;
    expect((await checkLive(U, d, { fetchImpl: fetchFrom({ [U]: res(200, live('||')) }), ...fast })).ok).toBe(false);
    expect((await checkLive(U, d, { fetchImpl: fetchFrom({ [U]: res(200, live('&&')) }), ...fast })).ok).toBe(true);
  });
  it('article callouts stay in pageText; page chrome does not', () => {
    const t = pageText('<main><h1>标题</h1><aside><strong>提醒标题</strong><p>提醒内容</p></aside><footer>相关笔记</footer></main>');
    expect(t).toContain('提醒内容');
    expect(t).not.toContain('相关笔记');
  });
  it('code fragment boundaries are preserved in the comparison key', () => {
    const v = (a, b) => parseNote(`---\ntitle: t\n---\nSet the retry range from \`${a}\` to \`${b}\`.`);
    expect(contentDiff(v('12', '3'), v('1', '23')).changed).toBe(true);
    expect(contentDiff(v('1', '23'), v('1', '23')).changed).toBe(false);
  });
  it('sign-to-sign corrections count as content changes', () => {
    const v = (x) => parseNote(`---\ntitle: t\n---\n温度下限调整为${x}度。`);
    expect(contentDiff(v('+1.5'), v('-1.5')).changed).toBe(true);
    expect(squash('+1.5')).toBe('+1.5');
    expect(squash('-1.5')).toBe('-1.5');
  });
  it('CTA text is excluded from pageText', () => {
    const t = pageText('<main><p>正文</p><aside class="bz-art__cta"><p>想把「LLM API 网关设计」落到你的团队？</p></aside></main>');
    expect(t).toContain('正文');
    expect(t).not.toContain('LLMAPI');
  });
  it('signs directly after Chinese text count as content changes', () => {
    const v = (x) => parseNote(`---\ntitle: t\n---\n温度下限调整为${x}度。`);
    expect(contentDiff(v('-1.5'), v('1.5')).changed).toBe(true);
  });
  it('punctuation-only metadata edits are not content changes', () => {
    const t = (x) => parseNote(`---\ntitle: ${x}\n---\n正文`);
    expect(contentDiff(t('这是原有标题！'), t('这是原有标题。')).changed).toBe(false);
  });
  it('numeric sign and decimal corrections count as content changes', () => {
    const v = (x) => parseNote(`---\ntitle: t\n---\n| presence_penalty | ${x} |\n`);
    expect(contentDiff(v('-1.5'), v('1.5')).changed).toBe(true);
    expect(contentDiff(v('1.6'), v('1.5')).changed).toBe(true);
    expect(contentDiff(v('1.5'), v('1.5')).changed).toBe(false);
  });
  it('meta content keeps apostrophes inside double-quoted attributes', () => {
    expect(pageText('<main>x</main><meta property="og:title" content="AI Monetization: Is OpenAI Retracing Dropbox&#39;s Path?">')).toContain('DropboxsPath');
  });
  it('seoTitle / seoDescription edits count as content changes', () => {
    const v = (seo) => parseNote(`---\ntitle: t\ndescription: d\nseoDescription: ${seo}\n---\n正文`);
    expect(contentDiff(v('新的搜索描述'), v('旧的搜索描述')).changed).toBe(true);
  });
  it('no checkable lines: 200 + self canonical is enough (deploy already confirmed)', async () => {
    expect(await checkLive(U, { added: [], removed: [] }, { fetchImpl: fetchFrom({ [U]: res(200, page(U, 'x')) }), ...fast })).toEqual({ ok: true });
  });
  it('deletion-only edit: ok once the removed text is gone from the live page', async () => {
    const fpDel = { added: [], removed: [squash('被删掉的那一段文字')] };
    expect(await checkLive(U, fpDel, { fetchImpl: fetchFrom({ [U]: res(200, page(U, '保留的内容')) }), ...fast })).toEqual({ ok: true });
    expect((await checkLive(U, fpDel, { fetchImpl: fetchFrom({ [U]: res(200, page(U, '被删掉的那一段文字')) }), ...fast })).ok).toBe(false);
  });
});

describe('submitOne', () => {
  it('sends exactly one URL per request', async () => {
    const f = vi.fn(async () => res(200));
    await submitOne('https://fxai.ai/notes/a/', 'k', { fetchImpl: f });
    expect(JSON.parse(f.mock.calls[0][1].body).urlList).toEqual(['https://fxai.ai/notes/a/']);
  });
});

describe('indexNowKey', () => {
  it('finds the single key file in public/', () => {
    expect(indexNowKey()).toMatch(/^[0-9a-f]{32}$/);
  });
});
