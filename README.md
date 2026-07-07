# 白泽明理 Baize Tech 官网

设计型 AI 咨询官网。Astro 纯静态站点,同时部署 Cloudflare Pages(主站 `fxai.ai`)与 GitHub Pages(镜像)。设计语言来自 `designs/baize-design-system/`。

## 仓库结构

```
website/                 ← 仓库根
├─ site/                 ← Astro 官网工程(所有站点代码)
│  ├─ src/pages/         ← 首页 / 服务 / 方法论 / 关于 / 联系 / 明理笔记
│  ├─ src/content/notes/ ← 明理笔记 mdx(加文章 = 新增一个 .mdx)
│  ├─ functions/api/     ← Cloudflare Pages Function:联系表单写入飞书多维表格
│  ├─ src/styles/tokens/ ← 设计 token(canonical,`pnpm run tokens:push` 回灌 designs/)
│  └─ public/            ← robots.txt / llms.txt / og-default.png / 微信码 / favicon
├─ designs/              ← 设计系统源(token 单一事实源,视觉规范)
└─ docs/                 ← 需求、设计文档与上线手册
```

## 本地开发

```bash
cd site
corepack enable          # 启用 pnpm 9(首次)
pnpm install
pnpm dev                 # http://localhost:4321
pnpm build && pnpm preview
```

本地联调表单(真写飞书):`cp site/.dev.vars.example site/.dev.vars` 填入真实机密,再 `pnpm build && npx wrangler pages dev dist`(`.dev.vars` 已 gitignore,不入库)。

## 新增一篇明理笔记

在 `site/src/content/notes/` 新增一个 `.mdx`,填好 frontmatter(`title / description / pubDate / category / relatedService`),push 即可。CI 自动重建并部署。分类枚举见 `site/src/content.config.ts`。

## 设计 token 同步

token 以 `site/src/styles/tokens/` 为准。改完运行 `pnpm run tokens:push` 单向回灌 `designs/baize-design-system/tokens/`,让设计系统预览页跟上。方向固定,不反向手改。

## 部署

一份代码,两个目标,用环境变量 `PUBLIC_DEPLOY_TARGET` 切换。canonical 恒指向 CF 主域 `fxai.ai`;镜像自动带 `noindex` 去重。

- **主站 = Cloudflare Pages**(生产 `fxai.ai`):Root directory `site`、Build `pnpm build`、Output `dist`;变量与密钥在 CF dashboard 配(**生产环境、「文本」类型**)。**仓库内不放 `wrangler.toml`**——它一存在就会架空 dashboard 的变量/密钥,导致表单读不到配置。
- **镜像 = GitHub Pages**:`.github/workflows/deploy-ghpages.yml` 在 push 到 `master` 时构建;仓库 Settings → Pages → Source 选 **GitHub Actions**。私有仓库发 Pages 需付费方案,故本仓库为公开。

> **完整上线手册**(CF 建项目、环境变量分类、GoDaddy→Cloudflare DNS、四大踩坑)见 [`docs/deploy-cloudflare-pages.md`](docs/deploy-cloudflare-pages.md)。

联系表单字段 → 飞书多维表格列名:**姓名 / 公司 / 联系方式 / 感兴趣的服务 / 当前最想解决的问题**。表单机密(`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`BITABLE_APP_TOKEN`、`BITABLE_TABLE_ID`、`ALLOWED_ORIGIN`)只在 CF 环境变量里配,绝不进仓库、不进前端。

## 已知后续项

- 字体自托管:当前零外链字体(性能/隐私目标已达成),品牌字体走系统回退;如需完全还原 Poppins / JetBrains Mono,可用 Fontsource 自托管(可选增强)。
- 服务页 FAQ:已决定暂不补——代开发/代运维的边界由 How 证据条与「支撑层」段落表达。
