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

> 提醒:`baize-website.pages.dev`(以及自定义域名)= **生产**环境;`<hash>.baize-website.pages.dev` = **预览**环境。测哪个 URL,就得保证对应环境配了变量。

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
- [ ] `curl -s https://fxai.ai/ | grep -c email-decode` 返回 `0`(见 §6.1)。
- [ ] `curl -sI https://fxai.ai/_astro/<任一文件> | grep cache-control` 含 `immutable`(见 §6.2)。

### 6.1 CF 的 Email Address Obfuscation 会插一个关键路径脚本

Scrape Shield 的「Email Address Obfuscation」默认开启:它把页面里的 `mailto:` 改写成
`/cdn-cgi/l/email-protection#<hex>`,并注入 `/cdn-cgi/scripts/.../email-decode.min.js`。
代价有两层:一是这个脚本进了 HTML 的关键请求链(实测 +208ms);二是**人类**看不到邮箱
(禁用 JS 时彻底失效),而 JSON-LD 里的 `email` 字段因为在 `<script>` 里 CF 不碰,机器照样读得到——
正好反了。

本仓库的做法是用 CF 官方的 opt-out 注释包住邮箱链接(见 `SiteFooter.astro` / `contact.astro`):

```html
<!--email_off--><a href="mailto:...">...</a><!--/email_off-->
```

页面里没有任何邮箱被混淆时,CF 就不再注入那个脚本。**新增邮箱链接时别忘了照样包。**
(也可以在 Scrape Shield 面板整体关掉,但注释式 opt-out 是随代码走的,换 zone 不会丢。)

### 6.2 `_headers` 修 `/_astro/*` 的缓存

CF Pages 对所有静态资源默认发 `max-age=14400, must-revalidate`(4 小时)。而 `/_astro/*`
是内容哈希命名的——文件名一变就是新 URL,内容永不改变,4 小时的 revalidate 纯属浪费。
`site/public/_headers` 把它们提到 `max-age=31536000, immutable`。GH Pages 不支持
`_headers`,会当成一个普通静态文件,无害。

### 6.3 CF Pages 的尾斜杠规则(踩过)

CF Pages 按**产物文件的形态**决定哪个 URL 是终态,另一个 308 跳过去:

| 产物 | 终态(200) | 会被 308 的写法 |
| --- | --- | --- |
| `services/index.html` | `/services/` | `/services` |
| `404.html`(根级文件) | `/404` | `/404/`、`/404.html` |

**注意两行的方向是相反的**,所以不能写一个「一律补斜杠」的辅助函数。

改 Astro 的 `trailingSlash` **不会消除这个 308**——它是 CF 侧的。真正的修复是让站点
发出的地址就是终态地址:

- 站内 `href` 全部带尾斜杠(见 `SiteHeader.astro` 的 `NAV`);
- 每个页面的 `path` prop 声明自己的终态地址,`Seo.astro` 不做猜测;
- `astro.config.mjs` 里 `trailingSlash: 'always'` 只作**守卫**:dev/preview 里少写斜杠当场 404,
  上线后仍是 308,外部旧链接不会断。带扩展名的端点(`/rss.xml`、`/llms.txt`、`/sitemap-index.xml`)不受影响。

改完这样验证(把 dist 里所有内链抓出来逐条请求,**不要跟随重定向**,任何 3xx 都算失败):

```bash
grep -rho 'href="[^"]*"' site/dist --include=*.html | sed 's/href="//;s/"//' \
  | grep '^/' | sort -u \
  | while read -r l; do
      printf "%-46s %s\n" "$l" "$(curl -s -o /dev/null -w '%{http_code}' "https://fxai.ai$l")"
    done
```

同时确认 `canonical` 与 `sitemap-0.xml` 里的 `<loc>` 逐字一致——它们曾经一个带斜杠、一个不带。

## 7. 排障:表单「提交失败」(HTTP 500)怎么定位

前端只显示脱敏的通用文案(防止泄露后端细节),真实原因在服务端。按这个顺序查,几分钟能定位:

**① 直接打端点看真实状态码**(绕过前端):
```bash
curl -i -X POST 'https://fxai.ai/api/contact' \
  -H 'content-type: application/json' \
  --data '{"name":"诊断","company":"x","contact":"x@x.com","problem":"x","service":"诊断"}'
```
- `404` → Function 没部署(检查 Root directory / 构建产物 / 是否误走了 Workers 流程)。
- `500` → Function 跑了但内部抛错 → 看 ②。
- `200 {"ok":true}` → 通了。

**② 看 CF 实时日志**:CF Pages 项目 → 对应部署 → **Functions / 实时日志(Real-time Logs)** → 再提交一次 → 找 `contact submission failed:` 那行,后面就是飞书返回的真实错误码(见下表)。

**③ 用本地 `.dev.vars` 的值直连飞书 API 对照**——若直连能成功(换 token `code=0`、写记录 `code=0`),说明**值本身有效、问题在 CF 侧**(变量没配对/类型错/环境错);若直连也失败,才是凭据或表本身的问题。
```bash
# 换 token
curl -X POST 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal' \
  -H 'content-type: application/json' \
  --data '{"app_id":"<APP_ID>","app_secret":"<APP_SECRET>"}'
# 用返回的 token 写一条(字段名须与表头一致)
curl -X POST 'https://open.feishu.cn/open-apis/bitable/v1/apps/<APP_TOKEN>/tables/<TABLE_ID>/records?user_id_type=open_id' \
  -H 'content-type: application/json' -H 'authorization: Bearer <TOKEN>' \
  --data '{"fields":{"姓名":"诊断-可删除"}}'
```

### 飞书错误码速查(本项目真实遇到过)

| 日志里的错误 | 含义 | 根因 / 修法 |
|---|---|---|
| `feishu auth failed: invalid param` | 换 token 时 app_id/app_secret 为空 | 运行时读到 undefined:变量配在了「预览」而非「生产」、或用了「密钥」类型、或仓库里有 `wrangler.toml` 架空了 dashboard |
| `feishu write failed: code=91402 msg=NOTEXIST` | 目标多维表格/数据表不存在 | `BITABLE_APP_TOKEN` / `BITABLE_TABLE_ID` 值填错或**填反**(`tbl` 开头的是 table_id) |
| `feishu write failed: code=91403` | 无权限 | 飞书应用没被加为该多维表格的「可编辑」协作者 |

> 排障心法:每一步都拿**真实返回码/日志**取证,靠错误信息的变化(`invalid param` → `91402` → 直连 `code=0`)一层层剥离,而不是猜。本项目就是这样在四个叠加的坑里逐个定位的。

## 8. GitHub Pages 镜像(可选)

镜像是带 `noindex` 的冗余站,canonical 指向主站,不抢 SEO。

### ⚠️ 私有仓库发不了 Pages
**GitHub Free 方案下,私有仓库无法发布 GitHub Pages。** 症状:`deploy-pages@v4` 报
```
Error: Failed to create deployment (status: 404) ... Ensure GitHub Pages has been enabled
```
(构建本身是成功的,artifact 已生成,只是没有可发布的 Pages 目标。)两条出路:**把仓库改公开**(免费),或升级 GitHub Team/Pro(付费)。本仓库已选择**公开**。
> 日志里那句 "Node 20 is being deprecated..." 是 GitHub 层面的**非致命警告**,与此错误无关,不用管。

### 启用步骤
1. (若改公开)先清理仓库里的真实凭据:`site/.dev.vars.example` 别留真实 `app_token/table_id`(改成占位符);用 `git grep '<app_secret>' $(git rev-list --all)` 确认 `app_secret`/`app_id` 从未入库。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**(不是 "Deploy from a branch")。
3. **Actions → 最近一次 "Deploy to GitHub Pages (mirror)" → Re-run all jobs**(启用前的运行会卡在 deploy 步失败,启用后重跑即可成功)。
4. 镜像地址:`https://smartstudio.github.io/baize-website/`。

### workflow 里的构建变量(`.github/workflows/deploy-ghpages.yml`)
| 变量 | 值 | 说明 |
|---|---|---|
| `PUBLIC_DEPLOY_TARGET` | `ghpages` | 注入 noindex + 启用子路径 base |
| `PUBLIC_SITE_URL` | `https://fxai.ai` | canonical 恒指向主站 |
| `PUBLIC_GH_BASE` | `/baize-website/` | 项目站子路径;若给镜像配了自定义域名则改 `/` |
| `PUBLIC_FORM_ENDPOINT` | `https://fxai.ai/api/contact` | 表单跨源打到主站 Function |

### 让镜像的表单也能提交
镜像在 `https://smartstudio.github.io`,与主站不同源。要让镜像上的表单也能写飞书,主站 CF 的 `ALLOWED_ORIGIN`(生产、文本类型)必须**包含 `https://smartstudio.github.io`**,CORS 才放行。不配的话主站表单照常工作,只是镜像表单会被浏览器 CORS 挡下(镜像本就是备用,可选)。
