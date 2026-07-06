# 白泽明理 Baize Tech 官网

设计型 AI 咨询官网。Astro 纯静态站点，同时部署 Cloudflare Pages（主站）与 GitHub Pages（镜像）。设计语言来自 `designs/baize-design-system/`。

## 仓库结构

```
website/                 ← 仓库根
├─ site/                 ← Astro 官网工程（所有站点代码）
│  ├─ src/pages/         ← 首页 / 服务 / 方法论 / 关于 / 案例 / 联系 / 明理笔记
│  ├─ src/content/notes/ ← 明理笔记 mdx（加文章 = 新增一个 .mdx）
│  ├─ functions/api/     ← Cloudflare Pages Function：联系表单写入飞书多维表格
│  ├─ src/styles/tokens/ ← 设计 token（canonical，`pnpm run tokens:push` 回灌 designs/）
│  └─ public/            ← robots.txt / llms.txt / og-default.png / 微信码 / favicon
├─ designs/              ← 设计系统源（token 单一事实源，视觉规范）
└─ docs/                 ← 需求与设计文档
```

## 本地开发

```bash
cd site
corepack enable          # 启用 pnpm 9（首次）
pnpm install
pnpm dev                 # http://localhost:4321
pnpm build && pnpm preview
```

## 新增一篇明理笔记

在 `site/src/content/notes/` 新增一个 `.mdx`，填好 frontmatter（`title / description / pubDate / category / relatedService`），push 即可。CI 自动重建并部署。分类枚举见 `site/src/content.config.ts`。

## 设计 token 同步

token 以 `site/src/styles/tokens/` 为准。改完运行 `pnpm run tokens:push` 单向回灌 `designs/baize-design-system/tokens/`，让设计系统预览页跟上。方向固定，不反向手改。

## 部署

一份代码，两个目标，用环境变量 `PUBLIC_DEPLOY_TARGET` 切换。canonical 恒指向 CF 主域；镜像自动带 `noindex` 去重。

### Cloudflare Pages（主站）

1. 在 CF Pages 连接本 GitHub 仓库。
2. 构建设置：**Root directory = `site`**，Build command = `pnpm build`，Output = `dist`。
3. 环境变量：`PUBLIC_DEPLOY_TARGET=cloudflare`、`PUBLIC_SITE_URL=https://<你的主域名>`。
4. 机密（Function 用，切勿进仓库）：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`BITABLE_APP_TOKEN`、`BITABLE_TABLE_ID`、`ALLOWED_ORIGIN=https://<GitHub Pages 域名>`。
5. 绑定自定义域名 + CF DNS。`functions/` 随站点一起部署，联系表单端点为 `/api/contact`。

### GitHub Pages（镜像）

1. 工作流 `.github/workflows/deploy-ghpages.yml` 在 push 到 `main`/`master` 时自动运行。
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**。
3. 按实际改工作流里的占位：`PUBLIC_SITE_URL`（CF 主域）、`PUBLIC_GH_BASE`（`/<仓库名>/`，或用自定义域名时改 `/`）、`PUBLIC_FORM_ENDPOINT`（CF 主站的 `/api/contact` 绝对地址）。

## 待提供（上线前置）

- 对外自定义域名（CF 主站）。
- 飞书自建应用 `app_id` / `app_secret`（授予多维表格读写权限）。
- 多维表格 `app_token` / `table_id`，以及表单对应列名（姓名 / 公司团队 / 联系方式 / 最想解决的问题 / 感兴趣的服务）。
- GitHub 仓库（接入 CF Pages 与 GH Actions）。

本地填机密：`cp site/.dev.vars.example site/.dev.vars` 后填入，用 `npx wrangler pages dev dist` 联调表单（`.dev.vars` 已 gitignore）。

## 已知后续项

- 字体自托管：当前零外链字体，品牌字体走系统回退；如需完全还原 Poppins / JetBrains Mono，可用 Fontsource 自托管（可选增强）。
- 服务页可补一个「常见问题」段（代开发/代运维边界澄清，当前已在 How 证据条里表达）。
