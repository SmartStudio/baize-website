# 白泽明理官网 Astro 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 把白泽明理设计系统落成纯静态官网，明理笔记以仓库内 mdx 承载，同时部署 Cloudflare（主）与 GitHub Pages（镜像），联系表单经 Pages Function 写入飞书多维表格。

**Architecture:** 纯静态 SSG，一份构建产物两处部署，差异仅由 `PUBLIC_DEPLOY_TARGET` 环境变量控制（base 路径 + 镜像 noindex，canonical 恒指向 CF）。设计 token 从设计系统拷入 `site/src/styles/tokens/` 为准，`npm run tokens:push` 单向回灌。唯一动态需求（表单）隔离在一个 Cloudflare Pages Function 内，机密全留服务端。

**Tech Stack:** Astro v5（Content Layer）、@astrojs/mdx、@astrojs/sitemap、@astrojs/rss、Fontsource 自托管字体、Cloudflare Pages + Pages Functions、GitHub Actions、pnpm、vitest。

## Global Constraints

- 仓库根 = `website/`（本计划 Task 1 初始化）；站点代码全部在 `site/`。
- 设计语言不改：所有 `bz-*` CSS class 原样保留，token 值不动。
- 输出语言禁用 em-dash（`—`）；用逗号、冒号、句号。文案气质克制、可信，禁用「颠覆/赋能万物/一站式」等营销词与「账号代购/代理」等违禁词。
- 品牌色：navy `#071E5B`/蓝/天蓝仅出现在 logo 与插画；唯一 UI 强调色橙 `#E9961A`；圆角 0。
- Mono 字体（JetBrains Mono）只用于纯英文/数字，CJK 不进 mono。
- canonical 恒指向 CF 主域，与构建目标无关；镜像（ghpages）构建注入 `noindex`。
- 联系方式：邮箱 `fxai.labs@gmail.com`、微信二维码 `contact/微信二维码.jpg`、飞书表单三通路并存。
- 单语 zh-CN；`output: 'static'`；不引入前端框架 island（仅 `.astro` + 少量 vanilla JS）。
- 每次任务结束以一个可独立验证的交付物收尾并 commit。

## 任务依赖与并行图（供 subagent 分派）

```
[Task 1 工程骨架]  ← 必须最先，串行
        │
[Task 2 全局外壳]  ← 依赖 1，串行
        │
        ├──────────────── 并行扇出（每个可给不同 subagent，均只依赖 1+2）────────────────┐
        │                                                                                  │
  [Task 3 首页]  [Task 4 服务页]  [Task 5 方法论]  [Task 6 关于]  [Task 7 案例]            │
  [Task 8 明理笔记系统]  [Task 9 联系页 UI]  [Task 10 表单 Function]                        │
        │  （Task 9 与 10 通过下方 Interfaces 约定字段契约，可并行）                        │
        └──────────────────────────────────────────────────────────────────────────────────┘
        │
[Task 11 SEO 收尾]  ← 依赖 3~9 页面已存在
[Task 12 字体+性能]  ← 依赖 3~9
[Task 13 双部署]    ← 最后，依赖全部
```

- **串行前置**：Task 1 → Task 2。
- **可并行**：Task 3、4、5、6、7、8、9、10 在 Task 2 完成后同时开工（8 个 subagent）。它们各写各的文件，冲突面小（仅都在 `src/pages/` 与 `src/components/` 下新增文件，不改同一文件）。
- **收尾串行**：Task 11、12 依赖页面产出；Task 13 最后跑双目标构建验证。
- 若并行执行时担心 `pnpm-lock.yaml` 冲突，Task 8/10 需要装新依赖（vitest、@cloudflare/workers-types）时，把这些依赖预装步骤上移合并进 Task 1（见 Task 1 步骤 6 的可选依赖）。

---

### Task 1: 工程骨架与 token 接入

**Files:**
- Create: `.gitignore`（仓库根）
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/.nvmrc`
- Create: `site/src/styles/tokens/{colors,typography,spacing,effects,components}.css`（从设计系统拷贝）
- Create: `site/src/styles/global.css`
- Create: `site/scripts/tokens-push.mjs`
- Create: `site/src/pages/index.astro`（临时占位，Task 3 覆盖）
- Create: `site/src/env.d.ts`

**Interfaces:**
- Produces: 环境变量约定 `PUBLIC_DEPLOY_TARGET`（`cloudflare` | `ghpages`，缺省 `cloudflare`）、`PUBLIC_SITE_URL`（CF canonical 主域，缺省占位）、`PUBLIC_GH_BASE`（GH Pages 子路径，缺省 `/`）。所有后续任务的 `Astro.site` / canonical 均来自 `import.meta.env.SITE`。
- Produces: 全局样式入口 `src/styles/global.css`，被 `BaseLayout` 引入。

- [ ] **Step 1: 初始化 git 仓库并写 .gitignore**

Run（在仓库根 `website/`）：
```bash
cd /Users/zouyanjian/other-try/prepare/baize/website && git init
```
Create `.gitignore`：
```
node_modules/
site/dist/
site/.astro/
.DS_Store
*.log
.dev.vars
.wrangler/
```

- [ ] **Step 2: 写 site/package.json**

```json
{
  "name": "baize-site",
  "type": "module",
  "version": "0.1.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "tokens:push": "node scripts/tokens-push.mjs",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^5.2.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/rss": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: 写 site/astro.config.mjs（部署目标切换）**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const target = process.env.PUBLIC_DEPLOY_TARGET ?? 'cloudflare';
// canonical 主域恒为 CF；两处构建都用它做 site，从而 sitemap/canonical 去重指向主站
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://baize.example.com';
const GH_BASE = process.env.PUBLIC_GH_BASE ?? '/';

export default defineConfig({
  site: SITE,
  base: target === 'ghpages' ? GH_BASE : '/',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  vite: {
    define: {
      'import.meta.env.PUBLIC_DEPLOY_TARGET': JSON.stringify(target),
    },
  },
});
```

- [ ] **Step 4: 写 tsconfig.json 与 .nvmrc 与 env.d.ts**

`site/tsconfig.json`：
```json
{ "extends": "astro/tsconfigs/strict" }
```
`site/.nvmrc`：
```
20
```
`site/src/env.d.ts`：
```ts
/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly PUBLIC_DEPLOY_TARGET: 'cloudflare' | 'ghpages';
  readonly SITE: string;
}
```

- [ ] **Step 5: 拷贝五个 token 文件到 site，并写 global.css**

Run：
```bash
mkdir -p /Users/zouyanjian/other-try/prepare/baize/website/site/src/styles/tokens
cp /Users/zouyanjian/other-try/prepare/baize/website/designs/baize-design-system/tokens/{colors,typography,spacing,effects,components}.css \
   /Users/zouyanjian/other-try/prepare/baize/website/site/src/styles/tokens/
```
Create `site/src/styles/global.css`：
```css
@import './tokens/colors.css';
@import './tokens/typography.css';
@import './tokens/spacing.css';
@import './tokens/effects.css';
@import './tokens/components.css';
```

- [ ] **Step 6: 写单向同步脚本 scripts/tokens-push.mjs**

```js
import { copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src', 'styles', 'tokens');
const DEST = join(here, '..', '..', 'designs', 'baize-design-system', 'tokens');

const files = (await readdir(SRC)).filter((f) => f.endsWith('.css'));
for (const f of files) {
  await copyFile(join(SRC, f), join(DEST, f));
  console.log(`pushed ${f} -> designs/baize-design-system/tokens/`);
}
console.log(`done: ${files.length} token files synced to designs/`);
```

（可选依赖预装，若 Task 8/10 与本任务并行执行，在此一并装好以避免 lockfile 竞争：`pnpm add -D vitest @cloudflare/workers-types`。）

- [ ] **Step 7: 写临时首页占位，验证 token 生效**

`site/src/pages/index.astro`：
```astro
---
import '../styles/global.css';
---
<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>Baize scaffold check</title></head>
  <body>
    <h1 class="bz-logotype">白泽明理</h1>
    <a class="bz-btn bz-btn--primary" href="#">token 生效检查</a>
  </body>
</html>
```

- [ ] **Step 8: 安装依赖并验证构建**

Run：
```bash
cd /Users/zouyanjian/other-try/prepare/baize/website/site && pnpm install && pnpm build
```
Expected: 构建成功，`site/dist/index.html` 生成；打开 `pnpm preview` 后页面上「白泽明理」按品牌字标渲染、按钮为橙色（`#E9961A`），说明 token 已接入。

- [ ] **Step 9: Commit**

```bash
cd /Users/zouyanjian/other-try/prepare/baize/website
git add -A && git commit -m "chore: scaffold Astro site with design tokens"
```

---

### Task 2: 全局外壳（BaseLayout + Seo + JsonLd + SiteHeader + SiteFooter）

**Files:**
- Create: `site/src/components/Seo.astro`
- Create: `site/src/components/JsonLd.astro`
- Create: `site/src/components/SiteHeader.astro`
- Create: `site/src/components/SiteFooter.astro`
- Create: `site/src/layouts/BaseLayout.astro`
- Reference（读取以对齐导航与页脚结构）：`designs/baize-design-system/ui_kits/website-home/index-fugu.html`、`components/core/SiteHeader.jsx`

**Interfaces:**
- Produces: `BaseLayout` props：`{ title: string; description: string; path: string; ogImage?: string; jsonLd?: object | object[] }`。所有页面用它包裹。`path` 是干净路由（如 `/services`），canonical = `new URL(path, import.meta.env.SITE)`，不含 GH base。
- Produces: `Seo.astro` props：`{ title, description, path, ogImage? }`，输出 `<title>`、meta description、canonical、OG、Twitter、robots（ghpages 注入 noindex）。
- Produces: `JsonLd.astro` props：`{ schema: object | object[] }`，输出 `<script type="application/ld+json">`。
- Produces: 导航项常量 `NAV`（首页/服务/明理笔记/方法论/案例/关于白泽/联系我们），供 header 复用。内部链接一律用 `import.meta.env.BASE_URL` 前缀以适配 GH 子路径。

- [ ] **Step 1: 写 Seo.astro**

```astro
---
interface Props { title: string; description: string; path: string; ogImage?: string; }
const { title, description, path, ogImage = '/og-default.png' } = Astro.props;
const site = import.meta.env.SITE;
const canonical = new URL(path, site).href;
const ogUrl = new URL(ogImage, site).href;
const noindex = import.meta.env.PUBLIC_DEPLOY_TARGET === 'ghpages';
const fullTitle = path === '/' ? title : `${title} · 白泽明理`;
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex, follow" />}
<meta property="og:type" content="website" />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={ogUrl} />
<meta property="og:site_name" content="白泽明理 Baize Tech" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogUrl} />
```

- [ ] **Step 2: 写 JsonLd.astro**

```astro
---
interface Props { schema: object | object[]; }
const { schema } = Astro.props;
const list = Array.isArray(schema) ? schema : [schema];
---
{list.map((s) => <script type="application/ld+json" set:html={JSON.stringify(s)} />)}
```

- [ ] **Step 3: 写 SiteHeader.astro（sticky 导航 + 移动端汉堡）**

要求：读取 `index-fugu.html` 里 `bz-topbar` / header 的 class 结构，复刻为组件。导航项用下列常量；桌面横排、移动端汉堡切换（vanilla JS）。品牌名用 `.bz-logotype`。

```astro
---
const base = import.meta.env.BASE_URL;
const NAV = [
  { href: 'index.html', label: '首页' },
  { href: 'services', label: '服务' },
  { href: 'notes', label: '明理笔记' },
  { href: 'method', label: '方法论' },
  { href: 'cases', label: '案例' },
  { href: 'about', label: '关于白泽' },
  { href: 'contact', label: '联系我们' },
];
const link = (h: string) => (h === 'index.html' ? base : `${base}${h}`);
---
<header class="bz-topbar">
  <a class="bz-logotype" href={base}>白泽明理</a>
  <button class="bz-nav-toggle" aria-label="菜单" aria-expanded="false">≡</button>
  <nav class="bz-topbar__nav">
    {NAV.map((n) => <a href={link(n.href)}>{n.label}</a>)}
  </nav>
</header>
<script>
  const btn = document.querySelector('.bz-nav-toggle');
  const nav = document.querySelector('.bz-topbar__nav');
  btn?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(!!open));
  });
</script>
```
（若 `bz-topbar__nav.is-open` / `bz-nav-toggle` 样式在 components.css 中不存在，在 `components.css` 末尾补一段移动端展开样式，并在任务末尾 `npm run tokens:push` 回灌设计系统。）

- [ ] **Step 4: 写 SiteFooter.astro（含三条联系通路 + 全站 CTA）**

要求：底部含邮箱 `fxai.labs@gmail.com`、微信二维码图（`contact/微信二维码.jpg` 拷入 `site/public/wechat-qr.jpg`）、以及「预约 AI 落地诊断」CTA 指向 `/contact`。用现有 footer/utility class。

Run（拷图与 logo 资产到 public）：
```bash
cp "/Users/zouyanjian/other-try/prepare/baize/website/contact/微信二维码.jpg" \
   /Users/zouyanjian/other-try/prepare/baize/website/site/public/wechat-qr.jpg
```

- [ ] **Step 5: 写 BaseLayout.astro**

```astro
---
import '../styles/global.css';
import Seo from '../components/Seo.astro';
import JsonLd from '../components/JsonLd.astro';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';

interface Props { title: string; description: string; path: string; ogImage?: string; jsonLd?: object | object[]; }
const { title, description, path, ogImage, jsonLd } = Astro.props;
const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '白泽明理 Baize Tech',
  alternateName: 'Formal eXplainable AI',
  url: import.meta.env.SITE,
  logo: new URL('/og-default.png', import.meta.env.SITE).href,
  email: 'fxai.labs@gmail.com',
};
const schema = jsonLd ? [org, ...(Array.isArray(jsonLd) ? jsonLd : [jsonLd])] : org;
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href={`${import.meta.env.BASE_URL}favicon.svg`} />
    <Seo title={title} description={description} path={path} ogImage={ogImage} />
    <JsonLd schema={schema} />
  </head>
  <body>
    <SiteHeader />
    <main><slot /></main>
    <SiteFooter />
  </body>
</html>
```

- [ ] **Step 6: 用占位首页验证外壳渲染**

临时把 `src/pages/index.astro` 改为使用 BaseLayout 包一段占位内容，Run：
```bash
cd site && pnpm build && pnpm preview
```
Expected: 页面出现 sticky 顶部导航（7 项）、页脚含邮箱与微信码；查看源码 `dist/index.html` 中有 `<link rel="canonical">` 指向 `PUBLIC_SITE_URL`、有 Organization JSON-LD。

- [ ] **Step 7: 验证镜像 noindex 生效**

Run：
```bash
cd site && PUBLIC_DEPLOY_TARGET=ghpages PUBLIC_GH_BASE=/baize-website/ pnpm build
grep -c 'noindex' dist/index.html
```
Expected: 输出 `1`（ghpages 构建注入了 noindex）。再 `grep 'canonical' dist/index.html` 确认 canonical 仍指向 CF 主域。

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: base layout, SEO head, header/footer shell"
```

---

### Task 3: 首页（fugu 长页）

**Files:**
- Modify/Create: `site/src/pages/index.astro`（覆盖 Task 1 占位）
- Reference（移植来源）：`designs/baize-design-system/ui_kits/website-home/index-fugu.html`

**Interfaces:**
- Consumes: `BaseLayout`（Task 2）props 契约。

- [ ] **Step 1: 移植 fugu 长页 body**

读取 `index-fugu.html`，把其 `<body>` 内容（hero `bz-hero-split` + `bz-topbar` 除外，导航已在 SiteHeader）逐段搬进 `index.astro` 的 `<slot>` 区：hero → 工具信任条 `bz-logowall` → 服务三阶梯 `bz-tier`（五卡，内容取现有 v2 文案）→ 方法论 `bz-flow`（诊断→接入→工程→交付→沉淀）→ 证据 `bz-proof-strip` → 联系 CTA。所有 `bz-*` class 原样保留，文案原样保留（已是 v2）。用 BaseLayout 包裹：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="白泽明理，让每个组织都能明白 AI，用好 AI"
  description="设计型 AI 咨询：从接入、工程到交付，帮团队设计一条可验证、可复用的 AI 使用路径。只给方案、规范与蓝图，落地执行留给你的团队。"
  path="/"
>
  <!-- 移植 index-fugu.html 的 body 各段到此，去掉重复的顶部导航 -->
</BaseLayout>
```

- [ ] **Step 2: 内部链接改造**

把移植进来的所有站内 `href`（如 `service-page.card.html`）改为 `import.meta.env.BASE_URL` 前缀的干净路由：服务→`services`、明理笔记→`notes`、联系→`contact`、方法论→`method`。

- [ ] **Step 3: 构建 + 内容断言**

Run：
```bash
cd site && pnpm build
grep -q 'bz-tier' dist/index.html && grep -q 'Loop Engineering' dist/index.html && echo OK
```
Expected: 输出 `OK`（三阶梯与五项服务已渲染进静态 HTML）。

- [ ] **Step 4: 浏览器验证（桌面 1280 + 移动 375）**

用 Playwright 打开 `pnpm preview` 地址，桌面与 375px 各截一图：确认 hero、五卡三阶梯、方法论流程、页脚三通路都正常，移动端汉堡可展开，无横向溢出。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: home page (fugu long-form)"
```

---

### Task 4: 服务页

**Files:**
- Create: `site/src/pages/services.astro`
- Reference（移植来源）：`designs/baize-design-system/ui_kits/website-home/service-page.card.html`

**Interfaces:**
- Consumes: `BaseLayout`。

- [ ] **Step 1: 移植服务长页**

读取 `service-page.card.html`（已是完整 v2：hero + 五项三阶梯 + 适合谁四受众 + 合作方式含「只设计不下场」边界 + FAQ + 联系 CTA），把其 `<main>` 内容移进 `services.astro` 的 slot；去掉页内自带的 header/footer（已由外壳提供），保留其页面级 `.rail-title` / `.rail-lead` 等局部样式（若是 `<style>` 块，随组件保留为 scoped `<style>`）。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const services = [
  { name: 'Codex 中转站搭建', desc: '给团队一个稳定、可控、可审计的 Codex 使用入口。' },
  { name: 'LLM API 网关设计', desc: '团队所有 AI 调用的统一入口：鉴权、路由、限流、成本和审计一处管好。' },
  { name: 'AI 研发流设计', desc: '把 AI 编程纳入需求、实现、测试、评审、文档的真实流程。' },
  { name: 'Loop Engineering 设计', desc: '让 AI 像有经验的工程师一样，先自查再交付，每一轮都更准。' },
  { name: '想法到产品端到端交付设计', desc: '一条从想法到可用产品、每步都能验收的路线图。' },
];
const jsonLd = services.map((s) => ({
  '@context': 'https://schema.org', '@type': 'Service',
  name: s.name, description: s.desc, provider: { '@type': 'Organization', name: '白泽明理 Baize Tech' },
}));
---
<BaseLayout
  title="企业 AI 落地，不止是买工具"
  description="白泽五项服务串成接入→工程→交付的价值阶梯，只做设计不下场。含交付物设计口径、四类受众映射与合作边界。"
  path="/services"
  jsonLd={jsonLd}
>
  <!-- 移植 service-page.card.html 的 main 到此 -->
</BaseLayout>
```

- [ ] **Step 2: 内链改造**（同 Task 3 Step 2 规则）

- [ ] **Step 3: 构建 + 断言**

Run：
```bash
cd site && pnpm build && grep -q '不代开发' dist/services/index.html && grep -q 'application/ld+json' dist/services/index.html && echo OK
```
Expected: `OK`（合作边界文案 + Service 结构化数据都在）。

- [ ] **Step 4: 浏览器验证**（fullPage 截图，桌面 + 375）

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: services page (v2)"
```

---

### Task 5: 方法论页

**Files:**
- Create: `site/src/pages/method.astro`
- Reference：`index-fugu.html` 中的 `bz-flow` 结构、`designs/baize-design-system/DESIGN.md` §8（Flow 组件）

**Interfaces:**
- Consumes: `BaseLayout`。

- [ ] **Step 1: 写方法论页**

用 `bz-rail-section` + `bz-flow`，五段：诊断 → 接入 → 工程 → 交付 → 沉淀（需求 §5.5 文案）。每段一句话解释。结尾挂咨询 CTA。用 `bz-flow__out` 呈现每段产出（设计口径）。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const steps = [
  { k: 'Diagnose', t: '诊断', b: '团队现在怎么用 AI，有哪些真实阻塞。' },
  { k: 'Access',   t: '接入', b: '设计工具、网关、中转与安全边界。' },
  { k: 'Engineer', t: '工程', b: '设计研发流与迭代回路 Loop。' },
  { k: 'Deliver',  t: '交付', b: '设计从想法到产品的端到端路径。' },
  { k: 'Compound', t: '沉淀', b: '形成 Skills、SOP 与知识资产。' },
];
---
<BaseLayout title="白泽方法论：一条 AI 落地路径" description="诊断、接入、工程、交付、沉淀，五步把零散尝鲜变成可验证、可复用的组织 AI 能力。" path="/method">
  <!-- bz-rail-section + bz-flow 渲染 steps -->
</BaseLayout>
```

- [ ] **Step 2: 构建 + 断言**

Run：`cd site && pnpm build && grep -q '沉淀' dist/method/index.html && echo OK` → Expected `OK`

- [ ] **Step 3: 浏览器验证**（桌面 + 375）

- [ ] **Step 4: Commit** → `git commit -m "feat: method page"`

---

### Task 6: 关于页

**Files:**
- Create: `site/src/pages/about.astro`

**Interfaces:** Consumes `BaseLayout`。

- [ ] **Step 1: 写关于页**

内容（需求 §5.7）：为什么叫白泽明理、Formal eXplainable AI 含义、定位「设计型 AI 咨询，只设计不下场」、四条价值观（解释清楚 / 严谨落地 / 安全可信 / 长期沉淀）。用 `bz-rail-section` + `bz-cell` 排版，克制留白。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="关于白泽明理" description="白泽通万物之情；明是透明可解释，理是数理逻辑与可验证方法。我们是设计型 AI 咨询，只设计不下场。" path="/about">
  <!-- 品牌解释 + 定位 + 价值观四栏 -->
</BaseLayout>
```

- [ ] **Step 2: 构建 + 断言** → `grep -q '只设计不下场' dist/about/index.html && echo OK`
- [ ] **Step 3: 浏览器验证**（桌面 + 375）
- [ ] **Step 4: Commit** → `git commit -m "feat: about page"`

---

### Task 7: 案例页

**Files:**
- Create: `site/src/pages/cases.astro`

**Interfaces:** Consumes `BaseLayout`。

- [ ] **Step 1: 写案例页（场景案例，不编客户）**

需求 §5.6：用「场景案例」而非伪造客户。四类场景卡：AI 编程团队训练 / 小团队研发流程改造 / Codex 中转站·LLM 网关搭建 / Loop Engineering 与 Skills 沉淀。每卡明确标注「示意场景」，避免被误读为真实客户。用 `bz-cell-grid` + `bz-cell`。

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const scenes = [
  { t: 'AI 编程团队训练', b: '把个人尝鲜升级为团队统一工作流的示意路径。' },
  { t: '小团队研发流程改造', b: '人少团队从最小 AI 工作流起步的示意路径。' },
  { t: '中转站 / LLM 网关搭建', b: '组织级 AI 使用入口与网关的接入示意。' },
  { t: 'Loop 与 Skills 沉淀', b: '把有效回路固化成可复用资产的示意。' },
];
---
<BaseLayout title="场景案例" description="第一版以示意场景呈现白泽能解决的问题类型，不虚构客户。涵盖训练、研发流改造、网关搭建与 Loop 沉淀。" path="/cases">
  <!-- scenes 网格 + 每卡「示意场景」标记 + 咨询 CTA -->
</BaseLayout>
```

- [ ] **Step 2: 构建 + 断言** → `grep -q '示意场景' dist/cases/index.html && echo OK`
- [ ] **Step 3: 浏览器验证**（桌面 + 375）
- [ ] **Step 4: Commit** → `git commit -m "feat: cases page (scenario placeholders)"`

---

### Task 8: 明理笔记系统（Content Collections + 列表 + 文章 + 首批 mdx + RSS）

**Files:**
- Create: `site/src/content.config.ts`
- Create: `site/src/layouts/NoteLayout.astro`
- Create: `site/src/components/NoteCard.astro`
- Create: `site/src/pages/notes/index.astro`
- Create: `site/src/pages/notes/[...slug].astro`
- Create: `site/src/pages/rss.xml.js`
- Create: `site/src/content/notes/*.mdx`（首批 6 篇）
- Reference：`docs/requirements.md` §5.4（六话题簇 + 首批标题）

**Interfaces:**
- Consumes: `BaseLayout`。
- Produces: notes collection schema（见 spec §7）；`NoteCard` props `{ title, description, pubDate, category, slug }`。

- [ ] **Step 1: 写 content.config.ts**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['AI普及', 'AI编程', '企业落地', '安全可信', 'Loop与方法论', '案例复盘']),
    relatedService: z.string().optional(),
    cover: z.string().optional(),
    author: z.string().default('白泽明理'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
```

- [ ] **Step 2: 写首批 6 篇 mdx（先占位草稿，frontmatter 完整、正文 3~5 段）**

在 `src/content/notes/` 建 6 个文件，标题对齐需求 §5.4，示例其一 `why-not-just-buy-ai-accounts.mdx`：
```mdx
---
title: 企业为什么不能只买 AI 账号？
description: 分散买账号带来不可控风险，组织需要的是可信中转站与统一网关。
pubDate: 2026-07-06
category: 安全可信
relatedService: services
draft: false
---

（正文 3~5 段，克制解释型口吻，文末一句引导到服务页。）
```
其余五篇：`design-first-ai-dev-workflow.mdx`（AI编程/研发流）、`codex-into-real-workflow.mdx`（AI编程）、`what-is-loop-engineering.mdx`（Loop与方法论）、`idea-to-product-delivery.mdx`（企业落地）、`what-llm-gateway-solves.mdx`（安全可信）。

- [ ] **Step 3: 写 NoteCard.astro 与列表页 notes/index.astro**

列表：`getCollection('notes')` 过滤 `!draft`、按 `pubDate` 倒序；顶部六分类筛选（纯 HTML 锚点或 vanilla JS 过滤 DOM，无需框架）。每项渲染 NoteCard。用 `BaseLayout` 包裹，`path="/notes"`。

- [ ] **Step 4: 写文章页 notes/[...slug].astro + NoteLayout.astro**

`[...slug].astro` 用 `getStaticPaths` 从 collection 生成；`NoteLayout` 渲染标题/日期/正文 `<Content />`，注入 `Article` JSON-LD（headline/datePublished/author），文末据 `relatedService` 挂对应服务 CTA。

```astro
---
// notes/[...slug].astro
import { getCollection, render } from 'astro:content';
export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return notes.map((n) => ({ params: { slug: n.id }, props: { note: n } }));
}
const { note } = Astro.props;
const { Content } = await render(note);
---
```

- [ ] **Step 5: 写 rss.xml.js**

```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = (await getCollection('notes', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate - a.data.pubDate);
  return rss({
    title: '明理笔记 · 白泽明理',
    description: '白泽明理关于 AI 接入、工程与落地的笔记。',
    site: context.site,
    items: notes.map((n) => ({
      title: n.data.title, description: n.data.description,
      pubDate: n.data.pubDate, link: `/notes/${n.id}/`,
    })),
  });
}
```

- [ ] **Step 6: 构建 + 断言**

Run：
```bash
cd site && pnpm build
test -f dist/notes/index.html && test -f dist/rss.xml && grep -q 'BlogPosting\|Article' dist/notes/*/index.html && echo OK
```
Expected: `OK`（列表、RSS、文章结构化数据都在）。

- [ ] **Step 7: 浏览器验证**（列表页分类筛选可用；文章页文末 CTA 指向服务页；桌面 + 375）

- [ ] **Step 8: Commit** → `git commit -m "feat: baize notes content collection, list, article, rss"`

---

### Task 9: 联系页 UI（bz 原生表单 + 邮箱 + 微信码）

**Files:**
- Create: `site/src/pages/contact.astro`
- Create: `site/src/components/ContactForm.astro`
- Reference：`components/core/ContactForm.jsx`（字段结构参考）、需求 §5.8

**Interfaces:**
- Consumes: `BaseLayout`。
- Produces（**与 Task 10 的字段契约，务必一致**）：表单 POST 到 `/api/contact`，JSON body 字段：
  `{ name: string; org: string; contact: string; problem: string; service: string; _hp: string }`
  其中 `_hp` 是蜜罐（隐藏字段，正常用户为空）。`service` 取值集合：`诊断 | 培训 | 中转站/网关 | Loop/交付`。成功响应 `{ ok: true }`，失败 `{ ok: false, error: string }`。

- [ ] **Step 1: 写 ContactForm.astro（bz token 原生表单）**

字段（需求 §5.8）：姓名 `name` / 公司团队 `org` / 联系方式 `contact` / 当前最想解决的问题 `problem` / 感兴趣的服务 `service`（下拉四类）+ 隐藏蜜罐 `_hp`。用现有表单 class（见 components.css 的 contact form 段）。提交用 vanilla JS `fetch`，展示「已收到，1-2 个工作日内联系」（需求 §8）。

```astro
<form class="bz-form" id="contact-form">
  <input class="bz-form__field" name="name" required placeholder="姓名" />
  <input class="bz-form__field" name="org" placeholder="公司 / 团队" />
  <input class="bz-form__field" name="contact" required placeholder="联系方式（邮箱/微信/电话）" />
  <textarea class="bz-form__field" name="problem" required placeholder="当前最想解决的问题"></textarea>
  <select class="bz-form__field" name="service">
    <option value="诊断">预约 AI 落地诊断</option>
    <option value="培训">企业培训合作</option>
    <option value="中转站/网关">中转站 / 网关服务咨询</option>
    <option value="Loop/交付">Loop / 端到端交付路径共创</option>
  </select>
  <input name="_hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
  <button class="bz-btn bz-btn--primary" type="submit">提交咨询</button>
  <p class="bz-form__status" hidden></p>
</form>
<script>
  const form = document.getElementById('contact-form');
  const status = form.querySelector('.bz-form__status');
  const API = import.meta.env.PUBLIC_FORM_ENDPOINT || '/api/contact';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    status.hidden = false; status.textContent = '提交中…';
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      status.textContent = j.ok ? '已收到需求，我们会在 1-2 个工作日内联系你。' : ('提交失败：' + (j.error || '请稍后重试'));
      if (j.ok) form.reset();
    } catch { status.textContent = '网络异常，请稍后重试或直接邮件联系。'; }
  });
</script>
```
（`PUBLIC_FORM_ENDPOINT`：GH Pages 镜像需指向 CF 的绝对地址 `https://<cf域名>/api/contact`；CF 主站留空走同源 `/api/contact`。）

- [ ] **Step 2: 写 contact.astro（三通路：表单 + 邮箱 + 微信码）**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactForm from '../components/ContactForm.astro';
---
<BaseLayout title="联系我们" description="预约 AI 落地诊断，或就中转站、网关、Loop 与端到端交付路径咨询白泽明理。" path="/contact">
  <!-- 左：ContactForm；右：邮箱 fxai.labs@gmail.com + 微信二维码 img(/wechat-qr.jpg) -->
</BaseLayout>
```

- [ ] **Step 3: 构建 + 断言** → `grep -q 'fxai.labs@gmail.com' dist/contact/index.html && grep -q 'wechat-qr' dist/contact/index.html && echo OK`
- [ ] **Step 4: 浏览器验证**（表单在 375px 不溢出；微信码清晰）
- [ ] **Step 5: Commit** → `git commit -m "feat: contact page with native form, email, wechat qr"`

---

### Task 10: 表单端点 Pages Function（写入飞书多维表格）

**Files:**
- Create: `site/functions/api/contact.ts`
- Create: `site/functions/api/_feishu.ts`（纯函数：token 获取 + 字段映射，便于单测）
- Create: `site/functions/api/_feishu.test.ts`
- Create: `site/.dev.vars.example`（本地机密样例，真实 `.dev.vars` 不入库）

**Interfaces:**
- Consumes（**与 Task 9 字段契约一致**）：POST JSON `{ name, org, contact, problem, service, _hp }`。
- Produces: `POST /api/contact` → `{ ok: true }` | `{ ok: false, error }`；`OPTIONS /api/contact` 处理 CORS 预检。
- 依赖环境变量：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`BITABLE_APP_TOKEN`、`BITABLE_TABLE_ID`、`ALLOWED_ORIGIN`（GH Pages origin，逗号分隔可多个）。

- [ ] **Step 1: 写失败测试 _feishu.test.ts（字段映射 + token 请求体）**

```ts
import { describe, it, expect, vi } from 'vitest';
import { mapFields, getTenantToken } from './_feishu';

describe('mapFields', () => {
  it('把表单字段映射为 Bitable fields 列名', () => {
    const out = mapFields({ name: '张三', org: '白泽', contact: 'a@b.com', problem: '想接入 Codex', service: '诊断', _hp: '' });
    expect(out).toEqual({
      '姓名': '张三', '公司团队': '白泽', '联系方式': 'a@b.com',
      '最想解决的问题': '想接入 Codex', '感兴趣的服务': '诊断',
    });
  });
});

describe('getTenantToken', () => {
  it('用 app_id/app_secret 换取 tenant_access_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 0, tenant_access_token: 'tkn' }) });
    const token = await getTenantToken('id', 'secret', fetchMock);
    expect(token).toBe('tkn');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ app_id: 'id', app_secret: 'secret' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run：`cd site && pnpm test` → Expected: FAIL（`_feishu` 未定义）。

- [ ] **Step 3: 写 _feishu.ts 实现**

```ts
export interface ContactBody {
  name: string; org: string; contact: string; problem: string; service: string; _hp?: string;
}

export function mapFields(b: ContactBody): Record<string, string> {
  return {
    '姓名': b.name ?? '',
    '公司团队': b.org ?? '',
    '联系方式': b.contact ?? '',
    '最想解决的问题': b.problem ?? '',
    '感兴趣的服务': b.service ?? '',
  };
}

export async function getTenantToken(appId: string, appSecret: string, f: typeof fetch = fetch): Promise<string> {
  const r = await f('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const j: any = await r.json();
  if (j.code !== 0) throw new Error(`feishu auth failed: ${j.msg || j.code}`);
  return j.tenant_access_token as string;
}

export async function createRecord(
  token: string, appToken: string, tableId: string, fields: Record<string, string>, f: typeof fetch = fetch,
): Promise<void> {
  const r = await f(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ fields }) },
  );
  const j: any = await r.json();
  if (j.code !== 0) throw new Error(`feishu write failed: ${j.msg || j.code}`);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run：`cd site && pnpm test` → Expected: PASS（两个用例通过）。

- [ ] **Step 5: 写 contact.ts（Pages Function 入口 + CORS + 蜜罐 + 校验）**

```ts
import { mapFields, getTenantToken, createRecord, type ContactBody } from './_feishu';

interface Env {
  FEISHU_APP_ID: string; FEISHU_APP_SECRET: string;
  BITABLE_APP_TOKEN: string; BITABLE_TABLE_ID: string;
  ALLOWED_ORIGIN?: string;
}

function cors(origin: string, allowed?: string): Record<string, string> {
  const list = (allowed ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = list.includes(origin) ? origin : (list[0] ?? '');
  return {
    'access-control-allow-origin': allow || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

export const onRequestOptions: PagesFunction<Env> = ({ request, env }) =>
  new Response(null, { status: 204, headers: cors(request.headers.get('origin') ?? '', env.ALLOWED_ORIGIN) });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin') ?? '';
  const headers = { 'content-type': 'application/json', ...cors(origin, env.ALLOWED_ORIGIN) };
  try {
    const body = (await request.json()) as ContactBody;
    if (body._hp) return new Response(JSON.stringify({ ok: true }), { headers }); // 蜜罐命中，假装成功
    if (!body.name || !body.contact || !body.problem)
      return new Response(JSON.stringify({ ok: false, error: '缺少必填字段' }), { status: 400, headers });
    const token = await getTenantToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    await createRecord(token, env.BITABLE_APP_TOKEN, env.BITABLE_TABLE_ID, mapFields(body));
    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message ?? '服务器错误' }), { status: 500, headers });
  }
};
```

- [ ] **Step 6: 写 .dev.vars.example 与类型依赖**

`.dev.vars.example`：
```
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
BITABLE_APP_TOKEN=bascnXXXX
BITABLE_TABLE_ID=tblXXXX
ALLOWED_ORIGIN=https://<user>.github.io
```
Run（若 Task 1 未预装）：`cd site && pnpm add -D @cloudflare/workers-types`，并在 `tsconfig.json` 的 `compilerOptions.types` 加 `"@cloudflare/workers-types"`。

- [ ] **Step 7: 本地端到端验证（wrangler pages dev）**

Run：
```bash
cd site && cp .dev.vars.example .dev.vars   # 填入真实机密
pnpm build && npx wrangler pages dev dist
```
用 curl 打本地端点：
```bash
curl -s -X POST http://localhost:8788/api/contact -H 'content-type: application/json' \
  -d '{"name":"测试","org":"白泽","contact":"a@b.com","problem":"联调","service":"诊断","_hp":""}'
```
Expected: 返回 `{"ok":true}`，且飞书多维表格新增一行；蜜罐非空时返回 `{"ok":true}` 但表格不新增。

- [ ] **Step 8: Commit** → `git commit -m "feat: contact form pages function writing to feishu bitable"`

---

### Task 11: SEO 收尾（sitemap 校验 + llms.txt + robots per-target）

**Files:**
- Create: `site/public/robots.txt`
- Create: `site/public/llms.txt`
- Create: `site/public/favicon.svg`、`site/public/og-default.png`（品牌默认 OG 图，可用 logo 生成）
- Modify: 若需要，`astro.config.mjs`（确认 sitemap 集成已挂）

**Interfaces:** 依赖 Task 3~9 页面已存在（sitemap 才能收全 URL）。

- [ ] **Step 1: 写 robots.txt**

```
User-agent: *
Allow: /
Sitemap: https://baize.example.com/sitemap-index.xml
```
（`baize.example.com` 换成真实 CF 主域。）

- [ ] **Step 2: 写 llms.txt（LLM 爬虫站点索引）**

```
# 白泽明理 Baize Tech
> 设计型 AI 咨询：从接入、工程到交付，帮团队设计可验证、可复用的 AI 使用路径。只设计不下场。

## 服务
- Codex 中转站搭建 / LLM API 网关设计（接入）
- AI 研发流设计 / Loop Engineering 设计（工程）
- 想法到产品端到端交付设计（交付）

## 关键页面
- /services 服务
- /method 方法论（诊断→接入→工程→交付→沉淀）
- /notes 明理笔记
- /about 关于白泽
- /contact 联系
```

- [ ] **Step 3: 放置 favicon 与默认 OG 图**

用现有 `designs/baize-design-system/assets/baize-mark.png` 生成 favicon 与 og-default.png（1200x630，含品牌名与主张），放入 `site/public/`。

- [ ] **Step 4: 构建 + 断言**

Run：
```bash
cd site && pnpm build
test -f dist/sitemap-index.xml && test -f dist/robots.txt && test -f dist/llms.txt && echo OK
grep -q '/services' dist/sitemap-0.xml && echo 'sitemap has pages'
```
Expected: `OK` 且 sitemap 含各页面 URL（指向 CF 主域）。

- [ ] **Step 5: Commit** → `git commit -m "feat: sitemap, robots, llms.txt, favicon, default OG"`

---

### Task 12: 自托管字体 + 性能与可访问性打磨

**Files:**
- Modify: `site/package.json`（加 Fontsource 依赖）
- Modify: `site/src/styles/global.css`（引入字体，替换 Google Fonts 引用）
- Modify: `site/src/styles/tokens/typography.css`（若其中有外链字体引用则改为本地）

**Interfaces:** 依赖页面已存在，做全站回归。

- [ ] **Step 1: 装 Fontsource 字体并本地引入**

Run：
```bash
cd site && pnpm add @fontsource/poppins @fontsource/jetbrains-mono @fontsource-variable/noto-sans-sc
```
在 `global.css` 顶部引入所需字重（如 `@fontsource/poppins/600.css` 等），删除 `typography.css` 里对 Google Fonts 的任何 `@import url(...)`（若存在），保持 font-family 变量名不变。

- [ ] **Step 2: 构建 + 断言无外链字体**

Run：
```bash
cd site && pnpm build
grep -rq 'fonts.googleapis.com' dist/ && echo 'STILL EXTERNAL' || echo 'self-hosted OK'
```
Expected: 输出 `self-hosted OK`。

- [ ] **Step 3: 可访问性与响应式回归**

用 Playwright 跑首页/服务/笔记文章三页的桌面 + 375px：检查单 `h1`、图片 alt、对比度、无横向溢出、CTA 可点。记录截图。

- [ ] **Step 4: Commit** → `git commit -m "perf: self-host fonts, a11y and responsive polish"`

---

### Task 13: 双部署（CF Pages + GitHub Pages 镜像）

**Files:**
- Create: `site/wrangler.toml`
- Create: `.github/workflows/deploy-ghpages.yml`（仓库根）
- Create: `site/public/.assetsignore`（可选，避免 Functions 被当静态资源）
- Create/Update: `README.md`（仓库根，部署说明）

**Interfaces:** 依赖全部任务。产出两个可访问站点。

- [ ] **Step 1: 写 wrangler.toml（CF Pages + Functions）**

```toml
name = "baize-website"
pages_build_output_dir = "dist"
compatibility_date = "2026-07-01"
```
（机密 `FEISHU_*` / `BITABLE_*` / `ALLOWED_ORIGIN` 在 CF Pages 项目设置里配置为环境变量，不写进 toml。）

- [ ] **Step 2: 写 GitHub Actions 镜像工作流**

`.github/workflows/deploy-ghpages.yml`：
```yaml
name: Deploy to GitHub Pages (mirror)
on:
  push: { branches: [main] }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: site } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, cache-dependency-path: site/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          PUBLIC_DEPLOY_TARGET: ghpages
          PUBLIC_SITE_URL: https://baize.example.com
          PUBLIC_GH_BASE: /baize-website/
          PUBLIC_FORM_ENDPOINT: https://baize.example.com/api/contact
      - uses: actions/upload-pages-artifact@v3
        with: { path: site/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
（`baize-website` / `baize.example.com` 换成真实仓库名与 CF 主域。）

- [ ] **Step 3: 验证两种目标本地构建都通过**

Run：
```bash
cd site
PUBLIC_DEPLOY_TARGET=cloudflare PUBLIC_SITE_URL=https://baize.example.com pnpm build && echo 'CF build OK'
PUBLIC_DEPLOY_TARGET=ghpages PUBLIC_GH_BASE=/baize-website/ PUBLIC_SITE_URL=https://baize.example.com pnpm build
grep -q 'noindex' dist/index.html && echo 'GH mirror noindex OK'
```
Expected: 两次构建均成功；GH 构建含 noindex；两次 canonical 都指向 CF 主域。

- [ ] **Step 4: 写 README 部署说明**

记录：CF Pages 连仓库设 root directory = `site`、配环境变量与机密；GH Actions 自动跑；自定义域名绑定；`npm run tokens:push` 用法；新增笔记 = 加 mdx 再 push。

- [ ] **Step 5: 推送并接入托管**

Run：
```bash
cd /Users/zouyanjian/other-try/prepare/baize/website
git add -A && git commit -m "chore: dual deploy config (cloudflare + github pages mirror)"
# 之后：在 GitHub 建仓库并 push；在 Cloudflare Pages 连接该仓库；在 GH 仓库 Settings→Pages 选 GitHub Actions
```

- [ ] **Step 6: 线上验证**

CF 主站与 GH 镜像各打开一遍：首页/服务/笔记/联系正常；CF 上提交一次表单确认写入飞书；确认 GH 镜像页 `<meta robots noindex>` 存在、canonical 指向 CF。

---

## Self-Review（作者自查记录）

**Spec 覆盖：**
- §3 技术栈 → Task 1、8、12。§4 目录 → Task 1、2。§5 token → Task 1、SiteHeader 补样式回灌。
- §6 页面映射 → 首页 T3 / 服务 T4 / 方法论 T5 / 关于 T6 / 案例 T7 / 笔记 T8 / 联系 T9。§7 Content Collections → T8。
- §8 SEO/LLM → Seo+JsonLd（T2）、sitemap+llms.txt+robots（T11）、noindex（T2 Step7 + T13）、RSS（T8）、自托管字体（T12）。
- §9 表单 → UI（T9）+ Function 写飞书（T10）。§10 部署 → T13。§11 范围 → 全量；后置项未排任务（符合 YAGNI）。§12 验收 → T3~T13 各页浏览器验证 + T13 线上验证。§13 待提供 → 在 T7/T10/T11/T13 以占位域名与机密样例标出，需用户替换。
- 联系方式 → 邮箱与微信码在 T2 页脚 + T9 联系页；飞书表单 T9+T10。

**占位扫描：** 页面移植任务以「读取指定源文件 + 明确改造规则」替代逐行复制（源文件在同仓可读），非禁止意义上的占位；净新增逻辑（config/Seo/JsonLd/Function/脚本/RSS/工作流）均给出完整代码。真实域名与机密以清晰可替换的样例值给出，属用户提供项。

**类型一致性：** 表单字段契约 `{name, org, contact, problem, service, _hp}` 在 T9 与 T10 两处一致；`mapFields` 输出列名在 T10 测试与实现一致；`BaseLayout` props `{title, description, path, ogImage?, jsonLd?}` 在 T2 定义、T3~T9 消费一致；环境变量 `PUBLIC_DEPLOY_TARGET`/`PUBLIC_SITE_URL`/`PUBLIC_GH_BASE`/`PUBLIC_FORM_ENDPOINT` 在 T1/T2/T9/T13 一致。
