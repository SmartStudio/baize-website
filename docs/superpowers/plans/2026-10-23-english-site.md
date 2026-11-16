# 白泽明理英文站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/en/` 下建一套面向海外 AI 转型客户的英文站,并把明理笔记按批次译成英文(含英文标签配图)。

**Architecture:** 英文笔记放 `src/content/notes/en/<slug>.mdx`,slug 与中文同名配对(collection id 为 `en/<slug>`)。纯函数 `src/lib/i18n.ts` 负责路径、配对和 hreflang;各页面主体抽成 `src/components/pages/*.astro` 组件 + `src/i18n/*.ts` 文案对象,中英两个路由文件共用一份样式。构建后用 `scripts/check-i18n-dist.mjs` 抓 `dist/` 产物做验收;用 `scripts/i18n-status.mjs` 列出缺译和过期篇目。

**Tech Stack:** Astro 7 + MDX content collection、`@astrojs/sitemap`(i18n 选项)、Cloudflare Pages(`_redirects`、Pages Function)、vitest 2、guizang-material-illustration + `codex exec` 出图。

**Spec:** `docs/superpowers/specs/2026-10-23-english-site-design.md`

## Global Constraints

- 所有命令在 `site/` 下跑,pnpm 9 + Node ≥22.12。
- 中文站 URL、中文文案、中文页面的 CTA 行为都不变。
- 站内 href 一律经 `import.meta.env.BASE_URL` 拼接,目录页带尾斜杠;`404` 页 path 为 `/404`、`/en/404`。
- 英文品牌名 `Baize Tech`;英文标题后缀 `· Baize Tech`;英文 `og:site_name` = `Baize Tech`。
- 英文页面可见文本里不得出现中文、微信、二维码、人民币价格、飞书。JSON-LD `<script>` 里的 Organization `name: '白泽明理'` 允许保留(同一实体)。
- 英文 `ctaVariant: 'api'` 笔记的文末 CTA 继续指向 `https://api.fxai.ai/sign-up`;其余英文 CTA 指向 `/en/contact/`。
- hreflang:中英配对时输出 `zh-Hans`、`en`、`x-default`(指中文)三条;不配对不输出。
- 笔记正文(中英文都算)每轮先执行 `Please remove all mannered prose.`;英文删掉 "It's not X, it's Y" / "The real key is" / "Here's the thing" 和收尾金句。
- 笔记互链只用 `<NoteLink slug="...">`;图片不放 `public/`;邮箱链接包 `<!--email_off-->`。
- 改 SEO 相关代码必须在 `dist/` 产物上验证(本计划的 `pnpm check:i18n`),不能只读代码。
- 不往 `components.css` 加页面专属样式。

## Review Focus

1. **GH 镜像的 base 前缀**:`base=/baize-website/` 构建下,所有 `/en/` 内链、语言切换链接、NoteLink 回退链接都要带前缀 → Task 6 的检查器对 ghpages 产物跑一遍。
2. **配对一方是 draft 或缺失**:中文篇设了 `draft: true` 而英文篇没有,英文页不能输出指向不存在中文页的 hreflang;英文篇没有中文孪生应直接构建失败 → Task 1 `pairNotes` 测试 + Task 2 路由断言。
3. **NoteLink 指向未翻译或不存在的 slug**:未翻译的回退到中文页并显示 "(Chinese)";拼错的 slug 构建失败 → Task 2 测试。
4. **英文页漏出中文**:页头字标、分类名、日期、表单提示、服务端报错、NoteCard → Task 6 检查器 + Task 5 函数测试。
5. **旧英文地址 301**:`_redirects` 每条的目标必须存在于 `dist/` → Task 6 检查器校验 `_redirects`。

---

## Phase 1 · 基础设施

### Task 1: `lib/i18n.ts` 纯函数 + 相关笔记按语言隔离

**Files:**
- Create: `site/src/lib/i18n.ts`
- Create: `site/src/lib/i18n.test.ts`
- Modify: `site/src/lib/notes.ts`(`relatedNotes`、新增 `CATEGORY_INTROS_EN`)
- Create: `site/src/lib/notes.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'zh-CN' | 'en'`
  - `noteLang(id: string): Lang` —— `id` 以 `en/` 开头即 `'en'`
  - `noteSlug(id: string): string` —— 去掉 `en/` 前缀
  - `notePath(slug: string, lang: Lang): string` —— `/notes/<slug>/` 或 `/en/notes/<slug>/`
  - `localePath(zhPath: string, lang: Lang): string` —— `'/'`→`'/en/'`,`'/services/'`→`'/en/services/'`,`'/404'`→`'/en/404'`
  - `withBase(base: string, path: string): string` —— `base` 以 `/` 结尾、`path` 以 `/` 开头,拼成一个斜杠
  - `alternates(zhPath: string | null, enPath: string | null): { hreflang: string; path: string }[]`
  - `pairNotes<T extends { id: string; data: { draft: boolean } }>(notes: T[]): { zh: Map<string, T>; en: Map<string, T> }` —— 只收非 draft;英文篇无中文孪生时 throw `Error('English note without Chinese source: <slug>')`
  - `CATEGORY_INTROS_EN: Record<Category, string>`(notes.ts)
  - `relatedNotes` 签名不变,行为改为只从同语言池里选

- [ ] **Step 1: 写失败测试 `src/lib/i18n.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { noteLang, noteSlug, notePath, localePath, withBase, alternates, pairNotes } from './i18n';

const n = (id: string, draft = false) => ({ id, data: { draft } });

describe('i18n paths', () => {
  it('从 collection id 推语言和 slug', () => {
    expect(noteLang('en/agent-sprawl-inventory')).toBe('en');
    expect(noteLang('agent-sprawl-inventory')).toBe('zh-CN');
    expect(noteSlug('en/agent-sprawl-inventory')).toBe('agent-sprawl-inventory');
    expect(noteSlug('agent-sprawl-inventory')).toBe('agent-sprawl-inventory');
  });
  it('笔记与页面路径', () => {
    expect(notePath('a', 'en')).toBe('/en/notes/a/');
    expect(notePath('a', 'zh-CN')).toBe('/notes/a/');
    expect(localePath('/', 'en')).toBe('/en/');
    expect(localePath('/services/', 'en')).toBe('/en/services/');
    expect(localePath('/404', 'en')).toBe('/en/404');
    expect(localePath('/services/', 'zh-CN')).toBe('/services/');
  });
  it('拼 base 只留一个斜杠', () => {
    expect(withBase('/baize-website/', '/en/notes/a/')).toBe('/baize-website/en/notes/a/');
    expect(withBase('/', '/en/')).toBe('/en/');
  });
  it('配对才输出 hreflang,x-default 指中文', () => {
    expect(alternates('/notes/a/', '/en/notes/a/')).toEqual([
      { hreflang: 'zh-Hans', path: '/notes/a/' },
      { hreflang: 'en', path: '/en/notes/a/' },
      { hreflang: 'x-default', path: '/notes/a/' },
    ]);
    expect(alternates('/notes/a/', null)).toEqual([]);
    expect(alternates(null, '/en/notes/a/')).toEqual([]);
  });
});

describe('pairNotes', () => {
  it('按 slug 分成中英两张表,排除 draft', () => {
    const { zh, en } = pairNotes([n('a'), n('en/a'), n('b', true)]);
    expect([...zh.keys()]).toEqual(['a']);
    expect([...en.keys()]).toEqual(['a']);
  });
  it('英文篇没有中文孪生时报错', () => {
    expect(() => pairNotes([n('en/x')])).toThrow('English note without Chinese source: x');
  });
  it('中文孪生是 draft 也算缺失', () => {
    expect(() => pairNotes([n('x', true), n('en/x')])).toThrow('English note without Chinese source: x');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run src/lib/i18n.test.ts`
Expected: FAIL,`Failed to resolve import "./i18n"`

- [ ] **Step 3: 实现 `src/lib/i18n.ts`**,只依赖字符串运算,不 import `astro:*`(要能在 vitest 里跑)。

- [ ] **Step 4: 写失败测试 `src/lib/notes.test.ts`**:构造 3 篇假笔记(`{ id, data: { lang, draft, pubDate, category, relatedService } }`,用 `as any` 过类型),断言 `relatedNotes(zhNote, all)` 里不含任何 `lang: 'en'` 的笔记,`relatedNotes(enNote, all)` 里不含 `lang: 'zh-CN'`。

- [ ] **Step 5: 改 `relatedNotes`**:`pool` 加 `n.data.lang === current.data.lang` 过滤,删掉 `+4` 那条打分;补 `CATEGORY_INTROS_EN`(6 条英文导语,每条一句,说明这一类笔记回答什么问题,和中文版对应但按海外读者写)。

- [ ] **Step 6: 跑测试**

Run: `pnpm vitest run src/lib`
Expected: PASS

- [ ] **Step 7: Commit** `feat(i18n): path helpers and per-language related notes`

---

### Task 2: 笔记路由拆分、存量英文笔记迁移、NoteLink 按语言解析

**Files:**
- Modify: `site/src/content.config.ts`(删 `alternatePath`,加 `sourceHash: z.string().regex(/^[0-9a-f]{12}$/).optional()`)
- Move: 4 篇英文笔记 → `site/src/content/notes/en/<中文 slug>.mdx`(映射见 spec §4.2);删除 frontmatter 里的 `alternatePath`;`cover:` 和正文 `import` 的相对路径改成 `../media/...`
- Modify: 4 篇对应中文笔记,删除 `alternatePath`
- Modify: `site/src/pages/notes/[...slug].astro`(只出中文)
- Create: `site/src/pages/en/notes/[slug].astro`
- Modify: `site/src/layouts/NoteLayout.astro`
- Modify: `site/src/components/notes/NoteLink.astro`
- Create: `site/src/components/notes/NoteLinkEn.astro`
- Modify: `site/src/components/notes/RelatedNotes.astro`、`site/src/components/NoteCard.astro`(href 改用 `withBase(base, notePath(slug, lang))`,`slug` prop 传 `noteSlug(n.id)`)
- Modify: 所有 `NoteCard` 调用方(`pages/index.astro`、`pages/notes/index.astro`、`pages/notes/category/[category].astro`)传 `slug={noteSlug(n.id)}`
- Create: `site/public/_redirects`

**Interfaces:**
- Consumes: Task 1 全部导出
- Produces:
  - `NoteLayout` 的 Props:删 `alternatePath`,新增 `alternates: { hreflang: string; path: string }[]` 和 `switchPath?: string`(对应语言版本的路径;无配对时不传)
  - `BaseLayout` 新 prop `switchPath?: string`(本任务加到 Props 上并原样透传给 `SiteHeader`;Task 3 实现切换链接)
  - `NoteLinkEn.astro`:Props `{ slug: string }`;英文路由通过 `components={{ ..., NoteLink: NoteLinkEn }}` 注入,MDX 作者无感

- [ ] **Step 1: 迁移文件**:`git mv` 4 篇英文笔记到 `en/`,改 slug、改相对路径、删 `alternatePath`;中文 4 篇删 `alternatePath`。
- [ ] **Step 2: 改 schema**,`pnpm check` 通过(若报 `alternatePath` 未知字段,说明漏删)。
- [ ] **Step 3: 中文路由** `[...slug].astro`:`getStaticPaths` 用 `pairNotes` 拿 `zh`/`en` 两张表,只为 `zh` 出页;每篇断言 `note.data.lang === noteLang(note.id)`,不一致 throw;`alternates` = `alternates(notePath(slug,'zh-CN'), en.has(slug) ? notePath(slug,'en') : null)`;`switchPath` 同理;删除旧的 `alternatePath` 互指校验。
- [ ] **Step 4: 英文路由** `src/pages/en/notes/[slug].astro`:同一套,但只为 `en` 出页,`path = notePath(slug,'en')`,注入 `NoteLinkEn`。
- [ ] **Step 5: NoteLayout**:接收 `alternates`/`switchPath` 透传给 `BaseLayout`;面包屑链接与 BreadcrumbList JSON-LD 的首页/列表地址用 `localePath('/', lang)`、`localePath('/notes/', lang)`;英文 consulting CTA 的 `primaryHref` → `withBase(base,'/en/contact/')`,`secondaryHref` → `withBase(base,'/en/services/')`,body 改为 "Remote-first AI transformation: consulting, team training, forward deployed engineering, and internal tools.";`publisher.name` 不变;API CTA 与中文 CTA 原样不动。
- [ ] **Step 6: NoteLink**:中文 `NoteLink.astro` 用 `getCollection` 检查 slug 存在于中文非 draft 笔记,不存在 throw `Error('NoteLink to unknown note: <slug>')`。`NoteLinkEn.astro`:slug 有英文版 → `/en/notes/<slug>/`;只有中文版 → `/notes/<slug>/` 且在链接后加 `<span class="bz-note-link__lang"> (Chinese)</span>`;都没有 → throw 同上。
- [ ] **Step 7: `_redirects`**,每条旧地址写两行(带/不带尾斜杠):

```
/notes/openai-compatible-open-model-api/ /en/notes/baize-open-model-api/ 301
/notes/openai-compatible-open-model-api /en/notes/baize-open-model-api/ 301
/notes/third-party-llm-router-security-guide/ /en/notes/third-party-llm-router-security/ 301
/notes/third-party-llm-router-security-guide /en/notes/third-party-llm-router-security/ 301
/notes/run-qwen38-mac-unsloth/ /en/notes/qwen38-mac-unsloth/ 301
/notes/run-qwen38-mac-unsloth /en/notes/qwen38-mac-unsloth/ 301
/notes/what-is-grok-bot-persistent-ai-teammates/ /en/notes/grok-bot-persistent-ai-teammates/ 301
/notes/what-is-grok-bot-persistent-ai-teammates /en/notes/grok-bot-persistent-ai-teammates/ 301
```

- [ ] **Step 8: 构建并抓产物**

Run: `pnpm build && grep -o 'hreflang="[^"]*" href="[^"]*"' dist/en/notes/qwen38-mac-unsloth/index.html dist/notes/qwen38-mac-unsloth/index.html`
Expected: 两个文件各 3 条,`en` 指 `https://fxai.ai/en/notes/qwen38-mac-unsloth/`,`zh-Hans` 与 `x-default` 指 `https://fxai.ai/notes/qwen38-mac-unsloth/`;`ls dist/notes/en` 不存在;`ls dist/notes/run-qwen38-mac-unsloth` 不存在。

- [ ] **Step 9: 临时验证 NoteLink 报错**:在任一中文笔记里临时写 `<NoteLink slug="no-such-note">x</NoteLink>`,`pnpm build` 应失败并含 `NoteLink to unknown note: no-such-note`;撤销。
- [ ] **Step 10:** `pnpm check && pnpm test` 通过。
- [ ] **Step 11: Commit** `feat(i18n): /en/notes routes, migrate English notes, 301 old URLs`

---

### Task 3: 页头页脚、语言切换、SEO 品牌与 Organization

**Files:**
- Modify: `site/src/components/SiteHeader.astro`、`site/src/components/SiteFooter.astro`、`site/src/layouts/BaseLayout.astro`、`site/src/components/Seo.astro`、`site/src/lib/organization.ts`

**Interfaces:**
- Consumes: `BaseLayout.switchPath`(Task 2)、`localePath`、`withBase`
- Produces: `SiteHeader` Props `{ lang?: Lang; switchPath?: string }`

- [ ] **Step 1: SiteHeader**:`NAV_EN` 换成 Services `/en/services/`、Notes `/en/notes/`、Method `/en/method/`、About `/en/about/`;CTA "Book a call" → `/en/contact/`;Logo 链 `/en/`;英文页不渲染 `hd__cn`。新增语言切换链接 `<a class="hd__lang">`(放 CTA 前):英文页显示 `中文`,中文页显示 `EN`;href = `switchPath ?? localePath('/', 对方语言)`,经 `withBase`;`hreflang` 与 `lang` 属性标对方语言。
- [ ] **Step 2: SiteFooter**:英文分支链接全改 `/en/...`,文案英文(Services / Method / About / Contact;Notes / RSS → `/en/rss.xml` / llms.txt → `/en/llms.txt`);tagline "Remote-first AI transformation: consulting, training, forward deployed engineering."；英文页不渲染 `ft__qr`;字标与版权在英文页为 `baize` / `© {year} Baize Tech`。
- [ ] **Step 3: Seo**:`titleSuffix` 默认值按 `lang` 取(`en` → `· Baize Tech`);`og:site_name` 英文为 `Baize Tech`。NoteLayout 里显式传的 `titleSuffix` 删掉。
- [ ] **Step 4: organization.ts**:`areaServed` 追加 `'Worldwide'`;其余不动。
- [ ] **Step 5: 构建并抓产物**

Run: `pnpm build && grep -c '白泽明理\|微信' dist/en/notes/qwen38-mac-unsloth/index.html; grep -o '<link rel="alternate"[^>]*>\|class="hd__lang"[^>]*' dist/notes/index.html`
Expected: 第一条只在 JSON-LD 里命中(人工看一眼命中行在 `<script type="application/ld+json">` 内);中文列表页有指向 `/en/` 的切换链接、无 alternate(Task 4 才配对列表页)。

- [ ] **Step 6: Commit** `feat(i18n): English header/footer, language switch, Baize Tech branding`

---

### Task 4: 英文列表页、分类页、llms.txt、RSS、sitemap

**Files:**
- Create: `site/src/pages/en/notes/index.astro`、`site/src/pages/en/notes/category/[category].astro`、`site/src/pages/en/llms.txt.ts`、`site/src/pages/en/rss.xml.js`
- Modify: `site/src/pages/notes/index.astro`、`site/src/pages/notes/category/[category].astro`(传 `alternates`/`switchPath`:列表页恒配对;分类页仅当英文同分类也有页时配对)
- Modify: `site/src/pages/llms.txt.ts`、`site/src/pages/rss.xml.js`(过滤 `noteLang(n.id) === 'zh-CN'`;`llms.txt` 的 `## Optional` 加一条 `- [English site](https://fxai.ai/en/llms.txt): English index`)
- Modify: `site/astro.config.mjs`

**Interfaces:**
- Consumes: `pairNotes`、`notePath`、`localePath`、`alternates`、`CATEGORY_INTROS_EN`、`categoryLabel`

- [ ] **Step 1: 英文列表页**:结构照中文 `notes/index.astro`,标题 "Notes",`Blog` JSON-LD `name: 'Baize Tech Notes'`、`inLanguage: 'en'`,只列英文非 draft;分类筛选只列英文非空分类,标签用 `categoryLabel(c,'en')`;样式与中文页共用的方式见 Phase 2 的组件化约定,这里可以先把中文页主体抽成 `components/pages/NotesIndex.astro` 接收 `lang`。
- [ ] **Step 2: 英文分类页**:`getStaticPaths` 只为英文非空分类出页,slug 用 `CATEGORY_SLUGS`,导语用 `CATEGORY_INTROS_EN`,siblings 只列英文非空分类。中文分类页同理抽组件。
- [ ] **Step 3: `en/llms.txt.ts`**:H1 `# Baize Tech`,引言一句英文 summary,`## Key pages` 列 5 个英文页,`## Notes` 列英文笔记(`notePath(slug,'en')`),`## Optional` 列 `/en/rss.xml` 与 `/sitemap-index.xml`。英文 summary、页面说明照 spec §4.4 口径写(4 项服务、远程为主、邮件联系)。
- [ ] **Step 4: `en/rss.xml.js`**:title `Baize Tech Notes`,只收英文,link 用 `notePath`。
- [ ] **Step 5: sitemap**:`sitemap({ i18n: { defaultLocale: 'zh', locales: { zh: 'zh-Hans', en: 'en' } } })`。
- [ ] **Step 6: 构建并抓产物**

Run: `pnpm build && ls dist/en/notes/category && grep -c 'xhtml:link' dist/sitemap-0.xml && grep -c '/en/notes/' dist/llms.txt dist/rss.xml dist/en/llms.txt`
Expected: 英文分类目录只有 `ai-coding enterprise trust-safety`;sitemap 有 `xhtml:link`;`dist/llms.txt`、`dist/rss.xml` 命中 0(Optional 那条指向的是 `/en/llms.txt`,不含 `/en/notes/`),`dist/en/llms.txt` 命中 4。

- [ ] **Step 7: Commit** `feat(i18n): English notes index, categories, llms.txt, rss, sitemap hreflang`

---

### Task 5: 联系表单按语言

**Files:**
- Modify: `site/functions/api/_feishu.ts`、`site/functions/api/contact.ts`、`site/functions/api/contact.test.ts`、`site/src/components/ContactForm.astro`

**Interfaces:**
- Produces: `ContactBody.lang?: 'zh-CN' | 'en'`;`mapFields` 多出 `'语言': b.lang === 'en' ? 'en' : 'zh-CN'`;`ContactForm` Props `{ lang?: Lang }`,表单里带 `<input type="hidden" name="lang">`

- [ ] **Step 1: 写失败测试**(追加到 `contact.test.ts`):

```ts
it('英文缺字段：报错是英文', async () => {
  const res = await onRequestPost(ctx({ company: 'Acme', lang: 'en' }));
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe('Missing required fields.');
});
it('英文写入失败：报错是英文且含邮箱', async () => {
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, tenant_access_token: 't' })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: 91403, msg: 'Forbidden' })));
  const res = await onRequestPost(ctx({ name: 'Ann', contact: 'a@b.com', problem: 'x', lang: 'en', _hp: '' }));
  expect((await res.json()).error).toBe('Submission failed. Please try again later or email contacts@fxai.ai.');
});
it('mapFields 写入语言列', () => {
  expect(mapFields({ name: 'a', company: '', contact: 'c', problem: 'p', service: '', lang: 'en' })['语言']).toBe('en');
  expect(mapFields({ name: 'a', company: '', contact: 'c', problem: 'p', service: '' })['语言']).toBe('zh-CN');
});
```

原有中文用例不改,继续断言中文报错。

- [ ] **Step 2:** `pnpm vitest run functions/api/contact.test.ts` → FAIL
- [ ] **Step 3: 实现**:`contact.ts` 里一个 `MESSAGES: Record<'zh-CN'|'en', { missing: string; failed: string }>`,中文取值保持现有原文。
- [ ] **Step 4:** 测试 PASS
- [ ] **Step 5: ContactForm**:所有可见文案(标题、标签、选项、按钮、状态提示)按 `lang` 分支;英文 `service` 选项值与 4 项服务对应:`Consulting` / `Training` / `FDE` / `Tools`(中文选项值不变)。
- [ ] **Step 6: Commit** `feat(contact): language-aware form and messages`

> **上线门槛**:合并前必须先请用户在飞书多维表格里新建文本列「语言」,并让用户确认已建好。否则线上每一次提交都会写表失败。

---

### Task 6: 产物检查器 `check:i18n` + 补齐工具 `i18n:status`

**Files:**
- Create: `site/scripts/check-i18n-dist.mjs`、`site/scripts/check-i18n-dist.test.mjs`
- Create: `site/scripts/i18n-status.mjs`、`site/scripts/i18n-status.test.mjs`
- Modify: `site/package.json`(scripts:`"check:i18n": "node scripts/check-i18n-dist.mjs dist"`、`"i18n:status": "node scripts/i18n-status.mjs"`)
- Modify: `website/CLAUDE.md`(新增「英文版」小节:目录与配对规则、`i18n:status` 流程、`check:i18n` 必跑、`public/_redirects` 加入「public 允许的文件」清单)

**Interfaces:**
- Produces:
  - `visibleCjk(html: string): string[]` —— 去掉 `<script>`、`<style>`、HTML 注释后,返回含 CJK(`/[一-鿿]/`)的文本片段
  - `sourceHash(content: string): string` —— `sha256(content)` hex 前 12 位
  - `computeStatus(zh: Map<string, { content: string; draft: boolean }>, en: Map<string, { sourceHash?: string }>): { missing: string[]; stale: string[] }` —— 都按 slug 排序;draft 中文不计入 missing
  - CLI `check-i18n-dist.mjs <distDir> [base]`:失败时逐条打印并 `process.exit(1)`

- [ ] **Step 1: 写失败测试**

```js
// check-i18n-dist.test.mjs
expect(visibleCjk('<p>Hello</p><script type="application/ld+json">{"name":"白泽明理"}</script>')).toEqual([]);
expect(visibleCjk('<span class="hd__cn">白泽明理</span>')).toEqual(['白泽明理']);
// i18n-status.test.mjs
expect(sourceHash('abc')).toBe('ba7816bf8f01');
const zh = new Map([['a', { content: 'A', draft: false }], ['b', { content: 'B', draft: false }], ['c', { content: 'C', draft: true }]]);
const en = new Map([['a', { sourceHash: sourceHash('old') }]]);
expect(computeStatus(zh, en)).toEqual({ missing: ['b'], stale: ['a'] });
```

- [ ] **Step 2:** `pnpm vitest run scripts` → FAIL
- [ ] **Step 3: 实现 `check-i18n-dist.mjs`**,对 `dist/en/**/*.html` 逐页检查:
  1. `visibleCjk` 为空(NoteLinkEn 的回退链接文字由作者写英文,不豁免);
  2. 不含 `wechat-qr` 和 `微信`;
  3. 不含 `api.fxai.ai/sign-up`,除非该页是 `ctaVariant: api` 的笔记(从页面上的 CTA 区判断,或比对一份从 frontmatter 读出的 api slug 列表,实现者选一种);
  4. 每条 `<link rel="alternate" hreflang>` 的目标在 dist 里存在,且目标页反向指回本页;
  5. 每个以 `base` 开头的站内 `href` 都能落到 `dist` 里的文件(`/x/` → `x/index.html`,`/404` → `404.html`);不以 `base` 开头的站内绝对路径直接报错(抓 GH 镜像丢前缀);
  6. 读 `public/_redirects`,每条目标在 dist 中存在。
  对 `dist/llms.txt`、`dist/rss.xml` 检查不含 `/en/notes/`。
- [ ] **Step 4: 实现 `i18n-status.mjs`**:读 `src/content/notes/*.mdx`(中文)与 `src/content/notes/en/*.mdx`,用正则取 frontmatter 的 `draft:`/`sourceHash:`;打印两张清单,每个 missing 后附上它当前的 `sourceHash`,方便翻译时直接填。
- [ ] **Step 5:** 测试 PASS
- [ ] **Step 6: 给 4 篇存量英文笔记补 `sourceHash`**(用 `pnpm i18n:status` 打印的值),再跑 `pnpm i18n:status`,Expected:missing 63 条,stale 0 条。
- [ ] **Step 7: 两种产物都跑检查器**

Run: `pnpm build && pnpm check:i18n && PUBLIC_DEPLOY_TARGET=ghpages PUBLIC_GH_BASE=/baize-website/ pnpm build && node scripts/check-i18n-dist.mjs dist /baize-website/`
Expected: 此时 `/en/` 主页面尚未建,两次运行都会 exit 1,且**报错只能是**「链接目标不存在:`/en/`、`/en/services/`、`/en/method/`、`/en/about/`、`/en/contact/`」这一类。出现其他任何报错都要先修。记下条数,Phase 2 结束时必须归零(exit 0)。

- [ ] **Step 8: Commit** `feat(i18n): dist checker and translation status tool`

---

## Phase 2 · 英文主页面

**组件化约定(适用于 Task 7–9):** 每个页面把现有 `.astro` 的模板和 scoped `<style>` 整体移到 `src/components/pages/<Name>.astro`,新增 Props `{ lang: Lang; copy: <Name>Copy }`;文案移到 `src/i18n/<name>.ts`,导出 `type <Name>Copy` 和 `zh`、`en` 两个对象。`src/pages/<name>.astro` 与 `src/pages/en/<name>.astro` 只剩包一层 `BaseLayout` + 组件(传 `lang`、`path`、`alternates`、`switchPath`)。中英结构差异(如英文没有二维码)用 copy 里的可选字段表达,不在组件里写 `isEnglish` 分支判断文案。

**中文不变的验证(每个任务都做):** 改动前 `pnpm build && cp -R dist <scratchpad>/dist-before`;改动后再 build,对该页面的 `<main>…</main>` 去掉 `data-astro-cid-[a-z0-9]+` 和 `astro-[a-z0-9]+` 类名后 diff,必须为空。

**英文文案口径(spec §4.4):** 4 项服务,锚点 `#consulting #training #fde #tools`;远程为主,FDE 写 remote-first forward deployed engineering,不承诺驻场;联系只给 `contacts@fxai.ai`;无价格、无二维码、无微信;按海外读者改写,不逐句翻译;执行 `Please remove all mannered prose.`。

### Task 7: 首页 `/en/`

**Files:** Create `src/components/pages/Home.astro`、`src/i18n/home.ts`、`src/pages/en/index.astro`;Modify `src/pages/index.astro`
- [ ] Step 1: 抓中文基线 → Step 2: 组件化 → Step 3: 中文 `<main>` diff 为空 → Step 4: 写 `en` 文案(最新笔记区只列英文笔记,用 `pairNotes(...).en`)→ Step 5: `pnpm build && pnpm check:i18n`,`/en/` 相关报错消失 → Step 6: Commit `feat(en): home page`

### Task 8: 服务页 `/en/services/`

**Files:** Create `src/components/pages/Services.astro`、`src/i18n/services.ts`、`src/pages/en/services.astro`;Modify `src/pages/services.astro`
- [ ] 同 Task 7 六步。额外断言:`grep -o 'id="\(consulting\|training\|fde\|tools\)"' dist/en/services/index.html | wc -l` = 4。中文版那句「也可以微信扫页脚二维码直接聊」在英文里改成邮件。Commit `feat(en): services page`

### Task 9: 方法论、关于、联系、404

**Files:** Create `src/components/pages/{Method,About,Contact,NotFound}.astro`、`src/i18n/{method,about,contact,notFound}.ts`、`src/pages/en/{method,about,contact,404}.astro`;Modify 对应中文页
- [ ] 同 Task 7 六步,每页一次 commit。联系页英文版用 `<ContactForm lang="en" />`,侧栏标题 "Email us",不渲染二维码,徽章写 "Contact · Remote-first"。英文 404 的 `path="/en/404"`、`noindex`(CF Pages 对 `/en/*` 的缺失地址会就近使用 `dist/en/404.html`)。
- [ ] 收尾:两种产物跑检查器,**Task 6 Step 7 记下的报错归零**;`pnpm check && pnpm test` 通过。

### Task 10: 上线 Phase 1+2

- [ ] Step 1: 请用户确认飞书表已建「语言」列(Task 5 门槛)。
- [ ] Step 2: 推分支、开 PR(正文附 `/en/` 各页截图和检查器输出),用户合并。
- [ ] Step 3: 线上验证(CF 主站部署完成后):

```bash
for p in /en/ /en/services/ /en/notes/ /en/notes/qwen38-mac-unsloth/ /en/contact/; do curl -s -o /dev/null -w "%{http_code} $p\n" https://fxai.ai$p; done
curl -sI https://fxai.ai/notes/run-qwen38-mac-unsloth/ | grep -i '^location\|^HTTP'
curl -s https://fxai.ai/en/notes/qwen38-mac-unsloth/ | grep -o '<link rel="alternate"[^>]*>\|<meta property="og:[a-z_:]*" content="[^"]*"'
```

Expected: 全部 200;旧地址 301 到 `/en/notes/qwen38-mac-unsloth/`;3 条 hreflang,`og:site_name` 为 `Baize Tech`,`og:image` 是 `.jpg`。
- [ ] Step 4: 在 `/en/contact/` 真实提交一次测试询盘,请用户确认飞书表里该行「语言」= `en`,然后删掉该行。

---

## Phase 3 · 笔记批量翻译(可重复的批次流程)

### Task 11: 一个翻译批次(每批 8 篇,重复执行到 missing 清零)

**顺序:** 先 `企业落地`、`安全可信`,再 `AI编程`、`AI普及`、`Loop与方法论`、`案例复盘`;同类内按 `pubDate` 新到旧。

**每篇的产物:**
- `src/content/notes/en/<slug>.mdx`
- `src/content/notes/media/<中文配图文件名去掉 .png>-en.png`(每张中文正文配图对应一张;中文名已带 `-zh` 后缀的,把 `-zh` 换成 `-en`)

**frontmatter 映射:** `title`/`description`/`coverAlt`/`howto` 译成英文;`lang: en`;`author: Baize Tech`;`pubDate` = 英文版发布当天;不写 `updatedDate`;`category`/`relatedService`/`ctaVariant`/`draft` 照抄;`cover: ../media/<与中文同一文件>`;`sourceHash` 填 `pnpm i18n:status` 打印的值。

- [ ] **Step 1:** `pnpm i18n:status`,按顺序取 8 个 missing slug(stale 的优先重译)。
- [ ] **Step 2: 翻译正文**(可每篇一个 subagent 并行;每个 subagent 拿到中文源文件、spec §4.9 规则、本 Task 的 frontmatter 映射和 Global Constraints 里的措辞规则):保留论证结构、事实、数字、日期、条款号;只适用于国内的例子换成海外读者能懂的说法或加一句说明,不编造事实;`<NoteLink slug>` 原样保留,链接文字译成英文;Figure 的 `import` 改指 `../media/*-en.png`,`alt`/`caption` 译成英文。
- [ ] **Step 3: 出英文配图**:对每张中文配图,用 `guizang-material-illustration` 技能,按 `docs/image-prompts.md` 的「正文配图」模板写提示词,标签换成英文(3–5 个,和中文图的标签一一对应)。经 `codex exec -C <scratchpad>/<slug> -s workspace-write --skip-git-repo-check --ephemeral "<提示词>" < /dev/null` 出图;提示词里写明「image_gen 存在 `~/.codex/generated_images/`,你必须 cp 到 `<scratchpad>/<slug>/<目标文件名>` 并 ls 验证」;跑完自己 `ls` 目标文件,不信退出码。
- [ ] **Step 4: 逐张 QA**(Read 图片):英文无拼写错误、无糊字、贴题、无 logo/水印/中文;不合格重出。通过后 cp 到 `src/content/notes/media/`。
- [ ] **Step 5: 构建验证**:`pnpm check && pnpm build && pnpm check:i18n`,ghpages 产物也跑一次检查器。
- [ ] **Step 6: 批次报告**发给用户:表格列 slug、英文标题、配图路径、本地化改动点;和国内绑定紧的篇目(如 `ai-coding-compute-sourcing`、`ai-strategy-first-customer`)单独列出,问要不要发,不要发的设 `draft: true`。
- [ ] **Step 7: Commit**(一批一次)`notes(en): batch N — <slug>, <slug>, …`;按用户习惯推送/开 PR。

### Task 12: 常态

存量清零后,新的中文笔记攒到若干篇时,重复 Task 11。中文笔记改过后,`pnpm i18n:status` 会把对应英文篇列进 stale,由用户决定是否重译。
