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
