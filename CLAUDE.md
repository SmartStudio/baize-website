# 白泽明理官网 · 项目约定

Astro 纯静态站(源码在 `site/`),双部署 CF 主站 + GH Pages 镜像。部署手册见 `docs/deploy-cloudflare-pages.md`,设计系统见 `docs/design-system.md`,笔记富媒体写作见 `docs/notes-rich-media.md`。

## 明理笔记配图 → 指定用 guizang-material-illustration 技能

**创建或更新「明理笔记」(`site/src/content/notes/*.mdx`)的任何图片——封面(cover)与正文配图(Figure)——一律用 `guizang-material-illustration` 技能生成,不要手写 SVG、不要用裸提示词直接出图。**

约定要点(技能的执行细节见其 `references/`,本项目的固定口径如下):

- **统一强调色 = 站点橙 `#E9961A`**(覆盖技能默认的 IKB 蓝),米白影棚背景,3D 物料/瑞士编辑风,和站点保持一套。
- **正文配图**:带中文印刷体标签(3–5 个,白标注板、大号、远离边缘),按 cycle/pipeline/hub/before-after 结构表达该篇核心概念。
- **封面**:无文字的单一主视觉头图(留白充足、缩略图也一眼看懂),与正文配图互补而非重复。
- **落地**:图生成到 scratchpad 审查(逐张 QA:无糊字、贴题、无 logo/水印/英文),满意后放到 `site/src/content/notes/media/<slug>-cover.png` 或 `<slug>-fig.png`;frontmatter 用 `cover: ./media/...`(经 `content.config.ts` 的 `image()` 优化),正文用 `import` + `<Figure src={...} width="wide" border />`。Astro 构建自动压成 WebP。
- **出图工具**:`codex exec -C <dir> -s workspace-write --skip-git-repo-check --ephemeral "<提示词,让它用内置 image_gen 一次性出图并保存,别用 ImageMagick 二次合成文字>"`(codex 已 ChatGPT 登录)。中文标签给一块白色标注板就不糊。
- 生成脚本参考:会话 scratchpad 里的 `guizang/gen-guizang.sh`(正文图)与 `guizang/gen-covers.sh`(封面)。

> 例外:只有当需要**逐像素精确、可无限缩放**的技术图(而 AI 出图无法保证标签准确)时,才考虑手写 SVG——但当前笔记均已改用 guizang 出图。

## 静态资源:别往 `site/public/` 放图

`public/` 是「绕过一切处理」的逃生舱:Astro 原样拷贝,不转格式、不缩放、不加内容哈希。
东西一放进去就脱离了构建系统的视野——曾经两张图误放这里,首页白扛 334 KB(见 `f1ec58f`)。

- **图片一律放 `site/src/assets/`,用 `<Image>` 引用**,让 `astro:assets` 自动出 WebP + 内容哈希文件名。
- `public/` 只留必须按固定 URL 提供的文件:`favicon.ico`、`apple-touch-icon.png`、`og-default.png`、
  `robots.txt`、`_headers`。
- **`public/` 里的同名文件会覆盖页面路由**。`llms.txt` 曾是手抄的静态文件,笔记写到 8 篇它还停在 6 篇;
  现在由 `src/pages/llms.txt.ts` 从 content collection 生成——但前提是把 `public/llms.txt` 删掉,
  否则新端点静默失效,构建不报错。
- 二值图(二维码这类纯黑白硬边图形)**不要用有损编码**:同一张 QR,`webp-q80` 要 22.5 KB,
  无损只要 2.1 KB。缩放必须取整数倍 + `kernel:'nearest'`,否则重采样会把模块推过阈值。
- 品牌图的源文件是 `site/src/assets/baize-mark.png`,`scripts/gen-favicon.mjs` 与
  `scripts/gen-og-default.mjs` 都从它派生;换 logo 后重跑这两个脚本。

## 站内链接:一律给终态地址

CF/GH Pages 会把非终态地址 308 跳走,每次点击白吃一跳,canonical 还会和 sitemap 对不上。
**规则不是「一律加斜杠」**——方向取决于产物形态:

| 产物 | 终态(200) | 会被 308 |
| --- | --- | --- |
| `services/index.html` | `/services/` | `/services` |
| `404.html` | `/404` | `/404/` |

所以:站内 `href` 带尾斜杠;每个页面的 `path` prop 自己声明终态地址,`Seo.astro` 不做自动补斜杠的猜测。
`astro.config.mjs` 的 `trailingSlash: 'always'` 只是守卫——dev/preview 里少写斜杠当场 404。
完整说明与验证脚本见 `docs/deploy-cloudflare-pages.md` §6.3。

## 邮箱链接必须用 `<!--email_off-->` 包住

CF 的 Email Address Obfuscation 会把 `mailto:` 改写成 `/cdn-cgi/l/email-protection#…` 并往关键路径
注入一个 `email-decode.min.js`(+208 ms),结果是**对人隐藏、对机器公开**(JSON-LD 在 `<script>` 里 CF 不碰)。
新增邮箱链接时照 `SiteFooter.astro` / `contact.astro` 的写法包起来,页面里没有邮箱可混淆,CF 就不注入脚本。
