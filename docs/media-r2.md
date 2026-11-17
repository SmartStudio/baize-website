# 笔记媒体:R2 存图,git 留指针

明理笔记的封面和配图(`site/src/content/notes/media/`)不进 git。图片以 WebP 存在 Cloudflare R2,git 里只有同名的 `.r2` 指针;构建前由 `scripts/media.mjs` 按指针把图片拉回原位置。页面、content schema、`<Image>`、OG JPEG 都照旧读本地文件。

## 为什么

2026-11-13 的数据:

- 主干文件树 881.7 MB,其中 744 张笔记 PNG 占 851.9 MB。
- `.git` 包 855.5 MiB。GitHub 建议仓库小于 1 GB。
- 11 月 1 日到 13 日净增 360 MB,平均每天 28 MB。

出图工具给的 PNG 每张约 1.3 MB。页面用的是 Astro 从源图再导出的 WebP 和 OG JPEG,源图只是构建输入,所以存成 WebP q95:744 张从 851.9 MB 降到 74.9 MB。每次构建都要拉回全部源图,源图小一个量级,拉取量也小一个量级。

画质实测:

- 源图(全部 744 张):像素尺寸全部一致;WebP q95 相对 PNG 的 PSNR 最低 39.9 dB、第 1 百分位 41.5 dB、中位 45.2 dB。最低那张在偏差最大处 1:1 对比看不出差别。
- 成品(每 25 张抽 1 张,共 30 张;1200 宽 WebP,sharp 默认质量):同一缩放算法下,由 WebP 源导出的比由 PNG 源导出的低 0.5 dB。
- Astro 实际构建时,sharp 对 WebP 源改用 libwebp 的「解码时缩小」,缩放算法与 PNG 路径不同,数值上低 3.2 dB(无损 WebP 也低 3.0 dB)。带中文标签的配图取 800 宽成品放大 2 倍对比,看不出差别。

## 结构

| 东西 | 位置 | 进 git |
| --- | --- | --- |
| 图片 | `site/src/content/notes/media/<slug>-cover.webp` | 否 |
| 指针 | `site/src/content/notes/media/<slug>-cover.webp.r2` | 是 |
| R2 对象 | `notes/<sha256>.webp`,桶 `baize-media` | — |
| 公开读地址 | `MEDIA_BASE_URL`,见下 | — |
| 本机对象缓存 | `<主仓库>/.git/media-cache/`,所有 worktree 共用 | 否 |
| 本机状态 | `media/.media-state.json` | 否 |

指针是两行文本:

```
sha256 a771c5d60c0f7820a4715050ee6d0210900f111558c0007039eb5749a6ecd077
size 69376
```

对象按内容寻址。同名图片重做会得到一个新对象,旧对象留在桶里,所以旧提交和别的分支仍然能构建,对象可以缓存一年。**不要删除或改写桶里的对象。**

## 日常用法(都在 `site/` 下)

出图或重做图之后(codex 照旧把 PNG 出到 `media/<slug>-cover.png`):

```bash
pnpm media:push                 # PNG 转 WebP 并删掉 PNG,上传新图和改过的图,写指针
git add src/content/notes/media/*.r2
```

mdx 引用转换后的文件:`cover: ./media/<slug>-cover.webp`、`import fig from './media/<slug>-fig.webp'`。

拉代码或切分支之后不用做什么,`pnpm dev` 和 `pnpm build` 会先跑 `media:pull`。单独执行:

```bash
pnpm media:pull                 # 缺的下载,指针变了的更新
pnpm media:pull --force         # 连本地改过没上传的也按指针覆盖
pnpm media:status               # 有没上传的图就以 1 退出
pnpm media:status --remote      # 再逐个确认 R2 上对象存在
pnpm media:webp                 # 只转格式不上传
```

`status` 里各状态的含义:

| 状态 | 含义 | 处理 |
| --- | --- | --- |
| ok | 本地文件与指针一致 | — |
| missing | 有指针,本地没文件 | `media:pull` |
| outdated | 指针已更新,本地是旧版的干净副本 | `media:pull` |
| modified | 本地重做过,还没上传 | `media:push` |
| new | 有文件没指针,从没上传过 | `media:push` |
| leftover | 有文件没指针,但这个版本上传过(切分支留下的) | 不用管 |

删图:删掉指针和本地文件。改名:改本地文件名后 `media:push`,再删旧指针。撤销过指针又想重新登记同一张图:`pnpm media:push <文件名>`。点名的文件不存在时以 1 退出。

`media:webp` 只处理 PNG。JPEG、已经是 WebP 的图原样上传。

## 构建

CF Pages 和 GitHub Actions 都只执行 `pnpm build`。拉图走公开地址,两边都不需要密钥。

- 指针对应的对象不在 R2 上(作者忘了 `media:push`):`media:pull` 报出文件名并以 1 退出,构建失败。CF Pages 和 GH Pages 都保留上一次成功的部署。
- 新图既没上传也没指针,或 mdx 里还写着 `.png`:`import` 的文件不存在,`astro build` 失败。
- 下载的内容与指针的 sha256 或字节数对不上:拒收,构建失败。本机缓存里的对象同样核对 sha256,对不上就重新下载。

上传用 `wrangler r2 object put`,授权来自本机 `wrangler login` 或环境变量 `CLOUDFLARE_API_TOKEN`。

## 公开读地址

`https://media.fxai.ai`(`scripts/media.mjs` 的 `DEFAULT_BASE_URL`)。这是 2026-11-17 绑到桶上的自定义域名(dashboard:R2 → `baize-media` → Settings → Custom Domains),走 Cloudflare 边缘缓存;对象上传时带了 `cache-control: public, max-age=31536000, immutable`。

它在 `fxai.ai` 这个 zone 里,zone 上的 WAF 和 Bot 防护规则对它同样生效。构建拉图拿到 403 时先查这些规则。

桶的 r2.dev 公开地址已关闭(读它返回 401)。迁移当天构建走过它:GitHub Actions 第一次构建 12 秒拉完 703 张后,剩下 41 个请求全部 429。所以 `media:pull` 遇到 429/503 会让所有并发请求一起停下,按 2、4、8、16、30 秒递增等待后重试,每个请求最多发 8 次(合计等 2 分钟),日志里会有一行 `rate-limited N request(s)`。等满仍被限速才算失败。这套重试对任何读地址都生效。

`media.fxai.ai` 出问题、需要临时退路时:dashboard 的 R2 → `baize-media` → Settings → Public Development URL 重新打开,构建时设 `MEDIA_BASE_URL=<r2.dev 地址>`。

换读地址不用动指针:对象 key 不变。换之前先跑 `MEDIA_BASE_URL=<新地址> pnpm media:status --remote`,结果里不能有 `NOT on` 行。

## 环境变量

| 变量 | 默认 | 用途 |
| --- | --- | --- |
| `MEDIA_BASE_URL` | 脚本里的 `DEFAULT_BASE_URL` | 公开读地址。也接受 `file:///目录`,把本地目录当桶(测试、离线演练) |
| `MEDIA_BUCKET` | `baize-media` | 上传的桶名 |
| `MEDIA_CACHE_DIR` | `<git 公共目录>/media-cache` | 本机对象缓存。设为空串关闭;`CI`/`CF_PAGES` 下默认关闭 |

## 原始 PNG

R2 里只存 WebP。出图工具给的 PNG 在 `media:push` 转换后就删掉,不上传,也不进 git。原图只在出图那台机器的 `~/.codex/generated_images/`。

迁移时的 744 张原始 PNG 曾归档在桶里,2026-11-17 已删除。它们还留在 `SmartStudio/baize-website-archive`(私有、已归档)的 git 历史里:`master` 分支的 `site/src/content/notes/media/`。本仓库的历史从迁移之后开始,不含这些 PNG。

## 迁移之前的历史

本仓库 2026-11-17 从一个初始提交重新开始。之前的 592 个提交在 `SmartStudio/baize-website-archive`(只读),更早的提交哈希只在那里能解析。

- 旧 `master` 停在 `ddfb8fb`。
- 迁移时只存在于本地的 13 个分支以标签留档,名字是 `archive/<原分支名>`。
- 其中 4 个含当时没发布的笔记,共 19 篇:`archive/notes/1107-b2`、`archive/notes/1109-b1n`、`archive/notes/1109-b2n`、`archive/notes/1110-b2n`。

从归档里取文件不用下载整个 855 MB 的历史。按需克隆只拿提交和目录(不到 1 MB),用到哪个文件才下载哪个:

```bash
git clone --filter=blob:none --no-checkout https://github.com/SmartStudio/baize-website-archive.git /tmp/baize-archive
cd /tmp/baize-archive
# 某个留档分支比旧 master 多了哪些文件(--no-renames:不让 git 为了判断改名去下载图片)
git diff --no-renames --name-only --diff-filter=A origin/master archive/notes/1110-b2n -- site/src/content/notes
# 只取要的几个文件
git checkout archive/notes/1110-b2n -- site/src/content/notes/<slug>.mdx site/src/content/notes/media/<slug>-cover.png
```

把旧分支上的笔记搬到本仓库:mdx 和它的 PNG 拷到同样的路径 → 在 `site/` 下跑 `pnpm media:push` → mdx 里的 `.png` 改成 `.webp` → 提交 mdx 和 `.webp.r2` 指针。
