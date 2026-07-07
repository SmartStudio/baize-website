# Cloudflare Pages 上线操作清单(主站)

> 目标:把 `SmartStudio/baize-website` 部署到 Cloudflare **Pages**,绑定域名 `fxai.ai`,让主站与 `/api/contact` 联系表单都跑起来。
> 工程在仓库子目录 `site/`,这点决定了「Root directory = site」这一步不能漏。

---

## 0. 先走对流程:是 Pages,不是 Workers

创建项目时,CF 后台可能把你引到 **Workers** 的导入界面(标题 "Configure your **Worker** project",部署命令默认 `npx wrangler deploy`)。**不要用那个流程。**

原因:本工程是 Pages 站点——`site/wrangler.toml` 用的是 Pages 专属字段 `pages_build_output_dir = "dist"`,`npx wrangler deploy`(Workers 命令)会直接报错;且联系表单 `site/functions/api/contact.ts` 用的是 Pages Functions 文件路由(`onRequestPost`),Workers 模型没有这套,走 Workers 会丢掉表单功能。

正确入口:**Workers & Pages → Create → 顶部切到 `Pages` 标签页 → Connect to Git**。

---

## 一、创建并连接项目

- [ ] CF 控制台 → **Workers & Pages** → **Create** → **Pages** 标签页 → **Connect to Git**。
- [ ] 授权并选择仓库 `SmartStudio/baize-website`,生产分支选 `master`。
- [ ] 构建设置(关键):
  - **Root directory(根目录 / 路径)= `site`** ← 子目录工程必设,最容易漏。
  - **Framework preset = `Astro`**(有就选,没有留 None 也行)。
  - **Build command = `pnpm build`**(CF 依据 `site/pnpm-lock.yaml` 自动用 pnpm 安装)。
  - **Output directory = `dist`**(`site/wrangler.toml` 已声明 `pages_build_output_dir = "dist"`,一致即可)。
  - Node 版本无需手动设:`site/.nvmrc` 已锁 `20`,CF 会自动读取。

## 二、环境变量(Settings → Environment variables → Production)

分两类。构建期变量在 `pnpm build` 时被烤进静态产物;运行期机密由 Pages Function 每次请求读取。**两类都在同一个界面配**,机密记得选 **Secret / 加密** 类型。

### 构建期(明文即可,`PUBLIC_` 前缀)

| 变量 | 值 | 说明 |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://fxai.ai` | **必填**,**不带末尾斜杠**(Astro `site` 约定)。不填则 canonical / sitemap / OG 全指向占位 `baize.example.com`,SEO 直接作废。 |
| `PUBLIC_DEPLOY_TARGET` | `cloudflare` | 可选(默认已是 cloudflare),显式写一份更清晰。 |

> ⚠️ 主站**不要设** `PUBLIC_FORM_ENDPOINT`——留空时表单自动提交到同源 `/api/contact`。也不要设 `PUBLIC_GH_BASE`(那是 GH 镜像构建才用的)。

### 运行期机密(选 Secret / 加密类型)

| 变量 | 值 | 说明 |
|---|---|---|
| `FEISHU_APP_ID` | `cli_...` | 飞书自建应用 ID |
| `FEISHU_APP_SECRET` | (你的 secret) | 飞书应用密钥 |
| `BITABLE_APP_TOKEN` | (多维表格 app_token) | URL 里 `base/` 后那段 |
| `BITABLE_TABLE_ID` | `tbl...` | URL 里 `?table=` 后那段 |
| `ALLOWED_ORIGIN` | `https://<GH Pages 镜像域名>` | 供镜像站跨源提交时收紧 CORS。主站同源不依赖它;若暂不上镜像可先留空(留空时回退为 `*`,仍可用但不够收紧)。支持逗号分隔多个来源。 |

> 这 5 个值就是本地 `site/.dev.vars` 里那 5 行,原样搬过来即可。
> 前置校验:飞书应用必须已被加为该多维表格的「可编辑」协作者(否则写入报 `91403`)——本地真实联调已通过,说明这步已完成。

## 三、域名 `fxai.ai`:把 DNS 从 GoDaddy 迁到 Cloudflare

`fxai.ai` 在 GoDaddy 购买。**要让根域(apex)`fxai.ai` 干净地指向 CF Pages,几乎必须把该域名的 DNS 托管迁到 Cloudflare。**

原因:DNS 标准不允许根域上放 CNAME,而 CF Pages 给的目标是 `baize-website.pages.dev`(需 CNAME 指向、无固定 IP)。GoDaddy 的 DNS 不支持 CNAME 拍平(flattening),所以在 GoDaddy 上无法把 `fxai.ai` 指到 CF Pages。Cloudflare 托管该域名后会在 apex 自动做 CNAME flattening,并自动建记录、签 SSL、上 CDN。

### 步骤 1 — 在 Cloudflare 添加站点
- CF 控制台 → **Websites** → **Add a site** → 输入 `fxai.ai` → 选 **Free** 方案。
- CF 自动扫描并导入 GoDaddy 现有 DNS 记录,然后给你**两个专属 nameserver**,形如:
  ```
  xxxx.ns.cloudflare.com
  yyyy.ns.cloudflare.com
  ```

### 步骤 2 — 在 GoDaddy 改 Nameserver
- GoDaddy → **Domain Portfolio** → 点 `fxai.ai` → **Nameservers(域名服务器)** → **Change** → 选 **"I'll use my own nameservers / 使用我自己的域名服务器"**。
- 删掉 GoDaddy 默认两条,填入 CF 给的那两个 → 保存。
- 生效通常几分钟到几小时;CF 上该站点状态变 **Active** 即完成。

### 步骤 3 — 在 CF Pages 绑定自定义域名
- CF Pages 项目 → **Custom domains** → **Set up a custom domain** → 输入 `fxai.ai`(CF 自动建 apex flatten + proxied 记录)。
- 再加一个 `www.fxai.ai`。
- 等 CF 自动签发 SSL(几分钟,状态 Active)。

### 步骤 4 — www 跳 apex(统一 canonical)
- CF 控制台该域名 → **Rules → Redirect Rules** → 新建:`www.fxai.ai/*` 301 到 `https://fxai.ai/$1`。
- canonical 以 apex 为准,与 `PUBLIC_SITE_URL` 一致。

### ⚠️ 迁 Nameserver 前必看
迁到 CF = `fxai.ai` 全部 DNS 记录改由 CF 托管。若该域名上已配**邮箱(MX)**或其他服务,CF 自动扫描通常会一并导入,但**改 nameserver 前务必去 CF 的 DNS 列表核对 MX / TXT 都在**,否则邮件会断。当前对外邮箱是 `fxai.labs@gmail.com`(gmail),若 `fxai.ai` 上尚未配域名邮箱,则无此顾虑。

### 备选:DNS 留在 GoDaddy(不推荐)
只能做到 `www.fxai.ai`:GoDaddy 加 CNAME `www` → `baize-website.pages.dev`,CF 自定义域名填 `www.fxai.ai`。apex `fxai.ai` 只能用 GoDaddy「域名转发」302 到 www,且 canonical 得改成 `https://www.fxai.ai`——不如迁 CF 稳,除非有强理由。

## 四、触发部署的顺序陷阱(务必按序)

CF Pages 的环境变量**只对「保存之后触发的构建」生效**。正确顺序:

1. 先把所有环境变量配齐并保存(尤其 `PUBLIC_SITE_URL=https://fxai.ai`)。
2. 再 **Deployments → Retry / Create deployment** 触发一次构建。
3. 若在填 `PUBLIC_SITE_URL` 之前已部署过一版,那版 canonical 还是占位域名,**必须重部署**。

> `PUBLIC_*` 是构建期烤进 HTML 的,改了必须重新构建才生效;机密是 Function 运行期每次请求读的,改了下次请求即生效、无需重构建。
> 若启用了 Preview(PR 预览)部署,记得把同样的变量也配到 **Preview** scope,否则预览环境的表单会因缺机密而 500。

## 五、上线后自查(逐条验证)

- [ ] 打开 `https://fxai.ai/` 正常加载;`www.fxai.ai` 会 301 跳到 apex。
- [ ] 查看网页源码:`<link rel="canonical" href="https://fxai.ai/...">` 指向真实域名(非 example.com),且**没有** `noindex`(noindex 只应出现在 GH 镜像站)。
- [ ] `https://fxai.ai/sitemap-index.xml`、`/robots.txt`、`/rss.xml` 均可访问。
- [ ] 提交一次联系表单 → 飞书多维表格新增一行 → 验证后删掉测试行。
- [ ] 手机宽度(375px)下首页与服务页无溢出、无错位。

## 附:与 GitHub Pages 镜像的联动(仅在你启用镜像时相关)

- 镜像站在**另一个源**,它的表单要跨源打到主站:在 GH workflow 里设 `PUBLIC_FORM_ENDPOINT=https://fxai.ai/api/contact`。
- 相应地,主站 CF 的 `ALLOWED_ORIGIN` 要包含镜像站域名,CORS 才放行。
- 私有仓库启用 GitHub Pages 需 Pro/Team 付费方案;否则镜像站需改公开仓库或另找托管(CF 主站不受此限)。
