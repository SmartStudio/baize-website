# 白泽明理官网 · Astro 实现方案（设计 spec）

版本：v1
日期：2026-07-06
状态：待用户评审
关联需求：`docs/requirements.md` v2.0
关联设计系统：`designs/baize-design-system/`（DESIGN.md 为视觉单一事实源）

---

## 1. 背景与目标

把已有的 token 驱动设计系统（纯 HTML + CSS）落成一个可持续运营的官网：

- 用 Astro 构建，输出纯静态站点。
- 明理笔记以仓库内 md/mdx 文件承载，新增内容 = 新增一个文件再 push。
- 同时部署到 Cloudflare Pages（主站）与 GitHub Pages（镜像）。
- 非笔记板块变动频率低，全站对 Google SEO 与 LLM 爬虫友好，并可持续优化。
- 联系表单在纯静态前提下把数据写入飞书多维表格。

设计语言（token 与组件视觉）在本期不改动，只做内容层与工程化落地。

## 2. 关键决策清单（已锁定）

| 维度 | 决定 | 理由 |
| --- | --- | --- |
| 框架 / 渲染 | Astro v5，`output: 'static'`（SSG） | 一份产物两处部署，零 JS，SEO/LLM 友好 |
| 首页 hero | fugu 长页版（源 `index-fugu.html`） | B2B 落地转化更强 |
| 明理笔记 | Content Collections，mdx 格式，同仓库 | 类型化 frontmatter，作者可在文中嵌组件 |
| 部署 | Cloudflare 主站 + GitHub Pages 镜像 | CF 更快、可跑 Function；GH Pages 作冗余镜像 |
| 重复内容 | canonical 恒指向 CF；镜像加 `noindex` | 避免两个域名被判重复内容 |
| 联系表单 | bz 原生表单 → CF Pages Functions → 飞书多维表格 API | 观感自控 + 数据进多维表格，机密留在服务端 |
| 表单端点形态 | Cloudflare Pages Functions（`functions/api/contact.ts`） | 与站点同仓同部署，CF 侧同源无 CORS |
| 代码目录 | 新建 `site/`，仓库根 = `website/` | 站点代码独立，同仓可相对引用 designs/ |
| token CSS 归属 | 拷进 `site/src/styles/tokens/` 为 canonical，`npm run tokens:push` 单向回灌 `designs/` | 就地改 CSS，单向脚本同步，零漂移 |
| 前端框架 island | 不引入（纯 `.astro` + 少量 vanilla JS） | 保持近零 JS |
| 多语言 | 单语 zh-CN（英文仅作辅助文案） | 需求：英文仅概念辅助 |

## 3. 技术栈

- Astro v5（Content Layer API）。
- 集成：`@astrojs/mdx`、`@astrojs/sitemap`、`@astrojs/rss`。
- 样式：沿用现有手写 token CSS，不引入 Tailwind。
- 包管理：pnpm；Node 版本用 `.nvmrc` 固定，保证 CI 可复现。
- 部署端点：Cloudflare Pages Functions（表单接收）。

## 4. 仓库与目录结构

仓库根 = 现有 `website/` 目录（本期初始化为 git 仓库）。站点代码全部在新目录 `site/`。

```
website/                              ← git 仓库根
├─ site/                              ← 新建：Astro 官网工程
│  ├─ astro.config.mjs
│  ├─ package.json / tsconfig.json / .nvmrc
│  ├─ wrangler.toml                   ← CF Pages / Functions 配置
│  ├─ scripts/
│  │  └─ tokens-push.mjs              ← site/src/styles/tokens → designs 单向同步
│  ├─ public/
│  │  ├─ robots.txt                   ← 随构建目标生成（见 §8）
│  │  ├─ llms.txt                     ← LLM 爬虫站点索引
│  │  ├─ favicon.* / og-default.png
│  │  └─ _headers                     ← CF 缓存 / 安全头
│  ├─ functions/
│  │  └─ api/contact.ts               ← 表单接收 → 飞书多维表格
│  └─ src/
│     ├─ styles/
│     │  ├─ tokens/ colors.css typography.css spacing.css effects.css components.css
│     │  └─ global.css                ← @import 五个 token（唯一入口）
│     ├─ components/                  ← 由现有 HTML 模板移植的 .astro
│     │  SiteHeader / SiteFooter / Hero / ServiceTier / Cell / Flow /
│     │  ProofStrip / NoteCard / ContactForm / Seo / JsonLd
│     ├─ layouts/
│     │  BaseLayout.astro             ← html + head(SEO) + header + footer
│     │  PageLayout.astro             ← 营销页外壳
│     │  NoteLayout.astro             ← 笔记文章外壳 + Article JSON-LD
│     ├─ pages/
│     │  index.astro                  ← 首页（fugu 长页）
│     │  services.astro               ← 服务
│     │  method.astro                 ← 方法论
│     │  cases.astro                  ← 案例（场景案例，不编客户）
│     │  about.astro                  ← 关于白泽
│     │  contact.astro                ← 联系（bz 原生表单）
│     │  notes/index.astro            ← 明理笔记列表 + 分类筛选
│     │  notes/[...slug].astro        ← 单篇文章
│     │  rss.xml.js                   ← 明理笔记 RSS
│     │  404.astro
│     ├─ content.config.ts            ← notes collection schema（Astro v5）
│     └─ content/notes/*.mdx          ← 明理笔记内容
├─ designs/                           ← 保留：设计系统（token 由脚本回灌）
├─ docs/                              ← 保留：需求 / 设计文档 / 本 spec
└─ .github/workflows/deploy-ghpages.yml
```

## 5. 设计系统 token 集成

- canonical = `site/src/styles/tokens/`（五个文件从 `designs/baize-design-system/tokens/` 拷贝而来）。
- `site/src/styles/global.css` 用 `@import` 串起五个 token 文件，作为全站唯一样式入口，`BaseLayout` 引入。
- 组件 markup 从现有 HTML 模板（`index-fugu.html`、`service-page.card.html` 等）忠实移植进 `.astro`；移植后这些 `.html` 退化为历史参考，不再作为生产源。
- 同步脚本 `scripts/tokens-push.mjs`（`npm run tokens:push`）：把 `site/src/styles/tokens/*` 单向拷回 `designs/baize-design-system/tokens/*`，让 `design-system.html` / `preview.html` 预览页跟上最新 token。方向固定，绝不反向手改 `designs/` 下的 token。

## 6. 页面架构与内容来源映射

导航（需求 §5.1）：首页 / 服务 / 明理笔记 / 方法论 / 案例 / 关于白泽 / 联系我们；移动端汉堡菜单。

| 页面 | 路由 | 内容来源 | 说明 |
| --- | --- | --- | --- |
| 首页 | `/` | `index-fugu.html` | 长页：hero → 工具信任条 → 服务三阶梯 → 方法论 → 证据 → 联系 |
| 服务 | `/services` | `service-page.card.html`（已 v2） | 五项服务 + 三层阶梯 + 四受众 + 合作边界 + FAQ |
| 方法论 | `/method` | `bz-flow` 组件 | 诊断 → 接入 → 工程 → 交付 → 沉淀 |
| 明理笔记列表 | `/notes` | Content Collections | 分类筛选、日期倒序、隐藏 draft |
| 明理笔记文章 | `/notes/<slug>` | `content/notes/*.mdx` | 文末挂对应服务 CTA |
| 案例 | `/cases` | 新建 | 只搭结构，用「场景案例」占位，不编造客户 |
| 关于白泽 | `/about` | 新建 | 品牌名 / FXAI 含义 / 只设计不下场 / 价值观 |
| 联系我们 | `/contact` | 新建 | bz 原生表单 + 四类咨询入口 |

首页组件复用现有 class：`bz-hero-split` / `bz-topbar` / `bz-logowall` / `bz-tier` / `bz-cell` / `bz-flow` / `bz-proof-strip` / `bz-rail-section`。

## 7. 明理笔记（Content Collections）

Astro v5 Content Layer，`src/content.config.ts`：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),                 // SEO meta + 列表摘要
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum([
      'AI普及', 'AI编程', '企业落地', '安全可信', 'Loop与方法论', '案例复盘',
    ]),
    relatedService: z.string().optional(),   // 内链回服务页锚点
    cover: z.string().optional(),
    author: z.string().default('白泽明理'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
```

- 新增文章：在 `src/content/notes/` 放一个 `.mdx`，填 frontmatter，push；CI 自动重建部署。
- 路由 `/notes/<slug>`，slug 由文件名派生。
- 列表页：读全部 notes，按 `category` 筛选、按 `pubDate` 倒序、`draft` 隐藏。
- 文章页：`NoteLayout` 渲染正文，注入 `Article` JSON-LD，文末挂 `relatedService` 对应服务 CTA。
- 首批文章按需求 §5.4 的六个话题簇标题铺 6 篇（可先占位草稿）。

## 8. SEO 与 LLM 友好

- `Seo.astro`（进 `<head>`）：`title` / `description` / canonical / Open Graph / Twitter card / `lang="zh-CN"`。canonical 恒指向 CF 主域，与构建目标无关。
- `JsonLd.astro` 结构化数据：
  - 全站 `Organization`（白泽明理 / Baize Tech / logo / sameAs）。
  - 服务页 `Service`（五项）。
  - 文章 `Article` / `BlogPosting`（headline / datePublished / author / image）。
  - 面包屑 `BreadcrumbList`。
- `@astrojs/sitemap` 自动 `sitemap.xml`。
- `@astrojs/rss` 输出明理笔记 `rss.xml`。
- `public/llms.txt`（可选 `llms-full.txt`）：给 LLM 爬虫的纯文本站点索引，列关键页面与笔记。
- 镜像去重：GH Pages 构建版注入 `<meta name="robots" content="noindex">`，且 `robots.txt` 指向 CF sitemap；canonical 已指向 CF。
- 语义化 HTML：每页单 `h1`，`h2/h3` 层级清晰，图片 alt 描述性。
- 性能即 SEO：自托管字体（Poppins / Noto Sans SC / JetBrains Mono，替换现有 Google Fonts 引用）、预加载、近零 JS，保障 Core Web Vitals。

## 9. 联系表单架构

数据流：

```
/contact 的 bz 原生表单
   │  fetch POST  /api/contact  (JSON)
   ▼
Cloudflare Pages Function  functions/api/contact.ts
   1. 校验蜜罐字段 + (可选) Cloudflare Turnstile
   2. 用 env 机密换 tenant_access_token（可选 KV 缓存约 2h）
   3. 表单字段 → Bitable fields 映射
   4. POST 飞书 records API 写入多维表格
   5. 返回 { ok } / { error }，带 CORS 头（放行 GH Pages origin）
   ▼
数据落进飞书多维表格
```

飞书接口：

- 换 token：`POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal`，body `{ app_id, app_secret }`，返回 `tenant_access_token`（有效期约 7200s）。
- 写记录：`POST https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records`，头 `Authorization: Bearer <tenant_access_token>`，body `{ fields: { ... } }`。

机密与配置（CF 环境变量 / `wrangler secret`，绝不进仓库、不进前端）：

- `FEISHU_APP_ID` / `FEISHU_APP_SECRET`
- `BITABLE_APP_TOKEN` / `BITABLE_TABLE_ID`
- 可选 `TURNSTILE_SECRET`

表单字段 ↔ 多维表格列（需求 §5.8）：姓名 / 公司团队 / 联系方式 / 当前最想解决的问题 / 感兴趣的服务。列名以用户建好的多维表格为准，在 Function 内做映射。

降级备选：若暂不配机密，联系页可先 iframe 嵌飞书表单分享页，之后无缝切回原生表单，页面外壳不变。

反垃圾：蜜罐隐藏字段 + 可选 Cloudflare Turnstile；Function 侧做基础频率与字段校验。

## 10. 部署

一份构建，两个目标，用环境变量 `DEPLOY_TARGET=cloudflare|ghpages` 切换 `site` / `base` / `noindex`。

- Cloudflare Pages（主）：dashboard 连仓库，root directory = `site`，build `astro build`，输出 `dist/`；设 `DEPLOY_TARGET=cloudflare` 与机密；绑定自定义域名 + CF DNS；push 自动部署。Pages Functions 随站点一起部署。
- GitHub Pages（镜像）：`.github/workflows/deploy-ghpages.yml` 用 `withastro/action`，working-directory = `site`，`DEPLOY_TARGET=ghpages`；push 到 main 触发；构建版带 `noindex`。
- base path 注意：GH Pages 项目站默认挂 `/<repo>/`，需正确设 `base` 且链接走 `import.meta.env.BASE_URL`；或给 GH Pages 也绑自定义子域走根路径。因其为镜像，接受子路径即可。

## 11. v1 范围与后置

必做（需求 §9.1）：首页 / 服务 / 明理笔记（列表 + 文章）/ 方法论 / 关于 / 联系 + 案例（结构占位）；响应式移动端；基础 SEO；明确 CTA。

后置（YAGNI）：每篇独立生成 OG 图、真实客户案例、i18n/英文站、站内搜索、笔记分页/标签体系、表单 KV 缓存优化、原生表单的 Turnstile（若首期不需要）。

## 12. 验收标准（对齐需求 §10）

- 首页 10 秒内说清白泽是谁、做什么、为何可信。
- 五项服务读得出「接入 → 工程 → 交付」阶梯，而非零散清单。
- 能看出「设计型咨询，只设计不下场」，不误认为外包开发。
- 明理笔记支撑专业信任并具基础 SEO（title/description/结构化数据/sitemap/RSS）。
- 每个关键页面有明确咨询入口；移动端阅读顺畅、表单路径清楚。
- 视觉克制、有东方神话识别度，不像蓝紫色 AI SaaS 模板。
- Lighthouse SEO 与 Best Practices 高分；构建产物为完整初始 HTML。

## 13. 待用户提供（实现前置）

- GitHub 仓库（创建并接入 CF Pages / GH Actions）。
- Cloudflare 账号、自定义域名（对外主域名是什么）。
- 飞书自建应用 `app_id` / `app_secret`（授予多维表格读写权限）。
- 多维表格 `app_token` / `table_id`，以及表单对应的列名。
- 品牌 sameAs 链接（如有官方社媒/GitHub），用于 Organization JSON-LD。

## 14. 实现顺序概览（详细计划见后续 writing-plans）

1. 初始化 git 仓库 + `site/` Astro 工程骨架 + token 拷入与 `tokens:push` 脚本。
2. BaseLayout / 全局样式 / SiteHeader / SiteFooter + 移植首页（fugu 长页）。
3. 服务 / 方法论 / 关于 / 案例页（复用组件）。
4. Content Collections + 明理笔记列表 + 文章模板 + 首批 6 篇占位。
5. SEO 层：Seo / JsonLd / sitemap / RSS / llms.txt / 镜像 noindex。
6. 联系表单：bz 原生表单 + Pages Function + 飞书写入 + 反垃圾。
7. 双部署：CF Pages 接入 + GH Actions 镜像 + 自定义域名 + canonical 校验。
8. 自托管字体 + 性能与可访问性打磨 + 全站浏览器验证。
