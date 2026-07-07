# Cloudflare Pages 上线操作清单(主站)

> 目标:把 `SmartStudio/baize-website` 部署到 Cloudflare **Pages**,绑定域名 `fxai.ai`,让主站与 `/api/contact` 联系表单都跑起来。
> 工程在仓库子目录 `site/`,这点决定了「Root directory = site」这一步不能漏。

---

## 0. 先走对流程:是 Pages,不是 Workers

创建项目时,CF 后台可能把你引到 **Workers** 的导入界面(标题 "Configure your **Worker** project",部署命令默认 `npx wrangler deploy`)。**不要用那个流程。**

原因:本工程是 Pages 站点,联系表单 `site/functions/api/contact.ts` 用的是 Pages Functions 文件路由(`onRequestPost`),Workers 模型没有这套,走 Workers 会丢掉表单功能。

正确入口:**Workers & Pages → Create → 顶部切到 `Pages` 标签页 → Connect to Git**。

---

## 1. ⚠️ 最大的坑:仓库里不要留 `wrangler.toml`

CF Pages 一旦在构建根目录发现 `wrangler.toml`,就把它当作配置的**唯一事实源**。官方原文:

> "This file becomes the **source of truth** when used, meaning that you **can not edit the same fields in the dashboard** once you are using this file."

后果链条(本项目真实踩过):
1. `site/wrangler.toml` 存在 → CF **忽略 dashboard 里配的所有环境变量和密钥**,改从文件的 `[vars]` 取。
2. 文件里没有 `[vars]` → 构建日志打出 `Build environment variables: (none found)`。
3. 运行时 `env.FEISHU_APP_ID` = undefined → `JSON.stringify` 丢掉空键 → 飞书收到空 body → 报 `feishu auth failed: invalid param` → 表单 500。

而密钥又**绝不能写进 `wrangler.toml`**(它在 git 里,一提交就泄露)。所以本项目的处理是:**删除 `site/wrangler.toml`,变量和密钥全部交给 dashboard 管理**。它原本声明的 `pages_build_output_dir`、`compatibility_date` 已在 dashboard 的构建设置(输出 `dist`)与运行时(兼容日期)里配好,`functions/` 目录由约定自动上传,均不依赖该文件。

---

## 2. 创建并连接项目

- [ ] CF 控制台 → **Workers & Pages** → **Create** → **Pages** 标签页 → **Connect to Git**。
- [ ] 授权并选择仓库 `SmartStudio/baize-website`,生产分支选 `master`。
- [ ] 构建设置:
  - **Root directory(根目录)= `site`** ← 子目录工程必设,最容易漏。
  - **Framework preset = `Astro`**(有就选,没有留 None 也行)。
  - **Build command = `pnpm build`**。
  - **Output directory = `dist`**。
  - Node 版本无需手动设:`site/.nvmrc` 已锁 `20`,CF 自动读取。

## 3. 环境变量(Settings → 变量和密钥 → 生产 Production)

**务必配到「生产」环境**(不是「预览」;两个环境分开)。改完变量**必须重新部署**才生效(变量在部署那一刻绑定进 deployment)。

> ⚠️ **实测重点:生产环境的变量全部选「文本」类型,不要选「密钥」类型。**
> 在当前(Workers 化后的)CF 后台,把这些变量存成「密钥/加密」类型时,Pages Function 运行时**读不到**(表现为空值 → `feishu auth failed: invalid param` 之类);全部改成「文本」类型后即正常。代价:`FEISHU_APP_SECRET` 等会以明文显示在 dashboard 里,因此务必**限制该 CF 项目的访问人员**。

全部用「文本」类型,分两组理解:

**构建期变量**(`pnpm build` 时烤进静态产物):
| 变量 | 值 |
|---|---|
| `PUBLIC_SITE_URL` | `https://fxai.ai`(无末尾斜杠) |
| `PUBLIC_DEPLOY_TARGET` | `cloudflare` |

**运行期变量**(Pages Function 每次请求读取):
| 变量 | 值 |
|---|---|
| `FEISHU_APP_ID` | `cli_...` |
| `FEISHU_APP_SECRET` | (你的 secret) |
| `BITABLE_APP_TOKEN` | 多维表格 app_token(`Wzo` 开头,27 位) |
| `BITABLE_TABLE_ID` | `tbl...`(16 位) |
| `ALLOWED_ORIGIN` | `https://<GH 镜像域名>`,暂无可留空 |

> 这几个值就是本地 `site/.dev.vars` 里那几行,原样搬过来。变量名逐字符核对、**首尾无空格**;值**无引号、无空格、无换行**。
> **`BITABLE_APP_TOKEN` 与 `BITABLE_TABLE_ID` 别填反**——`tbl` 开头的是 table_id,填反会让写入报 `feishu write failed: code=91402 msg=NOTEXIST`(指向了不存在的表)。
> 主站**不要设** `PUBLIC_FORM_ENDPOINT`(留空即走同源 `/api/contact`),也不要设 `PUBLIC_GH_BASE`(GH 镜像才用)。
> 前置校验:飞书应用必须已被加为该多维表格的「可编辑」协作者(否则写入报 `91403`)。

## 4. 域名 `fxai.ai`:把 DNS 从 GoDaddy 迁到 Cloudflare

`fxai.ai` 在 GoDaddy 购买。**要让根域(apex)`fxai.ai` 干净地指向 CF Pages,几乎必须把该域名的 DNS 托管迁到 Cloudflare。**

原因:DNS 标准不允许根域上放 CNAME,而 CF Pages 给的目标是 `baize-website.pages.dev`(需 CNAME 指向、无固定 IP)。GoDaddy 的 DNS 不支持 CNAME 拍平(flattening),所以在 GoDaddy 上无法把 `fxai.ai` 指到 CF Pages。Cloudflare 托管该域名后会在 apex 自动做 CNAME flattening,并自动建记录、签 SSL、上 CDN。

### 步骤 1 — 在 Cloudflare 添加站点
- CF 控制台 → **Websites** → **Add a site** → 输入 `fxai.ai` → 选 **Free** 方案。
- CF 自动扫描并导入 GoDaddy 现有 DNS 记录,然后给你**两个专属 nameserver**(形如 `xxxx.ns.cloudflare.com`)。

### 步骤 2 — 在 GoDaddy 改 Nameserver
- GoDaddy → **Domain Portfolio** → 点 `fxai.ai` → **Nameservers** → **Change** → 选 **"I'll use my own nameservers"**。
- 删掉 GoDaddy 默认两条,填入 CF 给的那两个 → 保存。生效通常几分钟到几小时;CF 上站点状态变 **Active** 即完成。

### 步骤 3 — 在 CF Pages 绑定自定义域名
- CF Pages 项目 → **Custom domains** → **Set up a custom domain** → `fxai.ai`,再加 `www.fxai.ai`。等 CF 自动签发 SSL。

### 步骤 4 — www 跳 apex(统一 canonical)
- CF 该域名 → **Rules → Redirect Rules** → `www.fxai.ai/*` 301 到 `https://fxai.ai/$1`。

### ⚠️ 迁 Nameserver 前必看
迁到 CF = `fxai.ai` 全部 DNS 记录改由 CF 托管。若该域名上已配**邮箱(MX)**等服务,改 nameserver 前务必去 CF 的 DNS 列表核对 MX / TXT 都在,否则邮件会断。当前对外邮箱是 `fxai.labs@gmail.com`(gmail),若 `fxai.ai` 上尚未配域名邮箱,则无此顾虑。

## 5. 触发部署的顺序(务必按序)

1. 先把所有环境变量配齐并保存(尤其生产环境的 `PUBLIC_SITE_URL`)。
2. 再 **Deployments → Retry / Create deployment** 触发一次构建(或往 `master` 推一个 commit,已开自动部署)。
3. `PUBLIC_*` 是构建期烤进 HTML 的,改了必须重构建;运行期变量(飞书那几个)是每次请求读的,改了也要重部署才绑定到新 deployment。

## 6. 上线后自查

- [ ] `https://fxai.ai/` 正常加载;`www.fxai.ai` 301 跳 apex。
- [ ] 源码里 `<link rel="canonical" href="https://fxai.ai/...">` 指向真实域名(非 example.com),且无 `noindex`。
- [ ] `https://fxai.ai/sitemap-index.xml`、`/robots.txt`、`/rss.xml` 可访问。
- [ ] 提交一次联系表单 → 飞书多维表格新增一行 → 验证后删掉测试行。
- [ ] 375px 宽度下首页与服务页无溢出、无错位。

## 附:与 GitHub Pages 镜像的联动

- 镜像站在另一个源,表单要跨源打到主站:GH workflow 设 `PUBLIC_FORM_ENDPOINT=https://fxai.ai/api/contact`。
- 主站 CF 的 `ALLOWED_ORIGIN` 要包含镜像站域名,CORS 才放行。
- 私有仓库启用 GitHub Pages 需 Pro/Team 付费方案;否则镜像站需改公开仓库或另找托管(CF 主站不受此限)。
