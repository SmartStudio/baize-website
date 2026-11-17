# 明理笔记配图 · 提示词模板（白泽青 · 亮底）

每篇笔记出两张图：一张封面（浅薄荷底、无字），一张正文配图（冷白底、带中文标签）。出英文版时再加一张英文标签的配图。都用 `guizang-material-illustration` 技能的风格，经 `codex exec` 调内置 `image_gen` 生成。配色规格见 `docs/design-system.md` §9，项目约定见根目录 `CLAUDE.md`「明理笔记配图」。

2026-11-17 起改用本页的亮底口径。改之前量过最近 12 篇（11 月 12–13 日发布）：

- 封面平均亮度 38–46（0–255），整张发黑。12 张是同一个构图：深色长条底座、灰褐色小机器人、小人、闸杆、一本铜色的书。
- 正文配图平均亮度 204–208，底色出成粉灰，物体是灰泥色。12 张都是「四步流水线 + 四块标签」。

旧口径里的三句话是原因，不要再抄：`Background deep ink green #062A25`、`Objects in matte dark green and light grey`、`Jade as a restrained glow`。更早的橙色写法（`local-tests/*/gen-images-prompt.md`）也不要抄。已发布的旧图不强制重做。

## 1. 固定口径

| 项 | 封面 | 正文配图 |
| --- | --- | --- |
| 背景 | 浅薄荷 `#D6F7EC`，墙和地同色，没有地平线 | 冷白 `#F4F6F5` |
| 物体 | 哑光白色实体，3D 渲染 | 白色实体，墨绿细描边 `#0A1F1C` |
| 翡翠绿 `#14E0A0` | 实色色块，只给一个部件 | 实色色块，每一步一个部件 |
| 深绿 `#06805A` | 小细节：镜头圈、限位线、信号灯 | 箭头和连线 |
| 文字 | 无任何文字 | 3–5 个简体中文标签，白色标注板 |
| 画什么 | 这一篇特有的一个主物体，至多两个配件 | 按结构画每一步的物体 |
| 比例 | 16:9，≥1200×675 | 16:9 |
| 平均亮度 | ≥ 210（实测 231–236） | ≥ 210（实测 227–230） |
| 出图路径 | `site/src/content/notes/media/<slug>-cover.png` | `<slug>-fig.png`，英文版 `<slug>-fig-en.png` |
| 入库后(`pnpm media:push`) | `<slug>-cover.webp` + `.webp.r2` | `<slug>-fig.webp` + `.webp.r2` |

调色板是封闭的：白、浅薄荷、翡翠绿、深绿、墨绿。出现橙、铜、棕、米、灰褐、粉、紫、蓝就重出。

共同禁止：深色背景、暗角、霓虹发光、灰泥或米色泥材质、小人、机器人、logo、水印、数字、UI 界面截图、聊天框。

## 2. 怎么写画面

模板里要填的只有两处画面描述。这两处决定图好不好认。

### 封面：一个主物体

写三件事：主物体是什么；哪个部件是翡翠绿；至多两个配件。

- 主物体取自这一篇的主词。危化品标签 → 贴着菱形标牌的桶；用电尖峰 → 一排负荷柱里冒出限位线的那一根；在制品积压 → 停在沙漏下的料箱。
- 翡翠绿给这篇在管的那个东西：被核对的标签、超限的柱、停住的箱。不拿它做装饰。
- 不画每篇都能用的道具：小人、机器人、长条底座、闸杆、书、办公桌。这些东西一出现，列表页的封面就分不出哪篇是哪篇。
- 标牌、表盘、卡片都写成空白的（`blank`），否则模型会往上画字和符号。

### 正文配图：先选结构

按内容选结构，不要一律四步流水线：

| 内容 | 结构 | 写法 |
| --- | --- | --- |
| 有先后的几步 | pipeline | 一行，从左到右，箭头相连 |
| 每月、每周重复 | cycle | 物体放在一个顺时针环形箭头的上、右、下、左 |
| 一个入口分给几方 | hub | 中间一个分发物体，周围是分支 |
| 改之前和改之后 | before-after | 左右两个状态，中间是改动 |
| 上下级、覆盖关系 | layer stack | 上下几层，标签在侧边 |

每一步画这一步的物体，不画人：签字用印章，拍板用开关，预警用铃，复盘用档案盒，放行用吊牌。

## 3. 提示词模板

把 `<…>` 换成该篇内容后整段交给 codex。`<your session id>` 不用换。不出英文版时删掉 IMAGE 3 整段。

```text
You are generating Guizang material illustrations for one 明理笔记 (a Baize note): a wordless cover and a labeled body figure.

Read first:
- ~/.codex/skills/guizang-material-illustration/SKILL.md
- ~/.codex/skills/guizang-material-illustration/references/visual-style.md
- ~/.codex/skills/guizang-material-illustration/references/prompt-patterns.md
- ~/.codex/skills/guizang-material-illustration/references/qa-checklist.md
- <repo>/docs/image-prompts.md

Project rules. They override the skill defaults wherever they differ:
- Use the built-in image_gen tool, one call per image. No SVG. No ImageMagick or any other tool to draw or overlay text.
- Every image is BRIGHT and high-key. No dark background, no dark floor or slab, no vignette, no night scene, no neon glow.
- The palette is closed: white, pale mint, jade green #14E0A0, deep green #06805A, ink green #0A1F1C. No orange, copper, brown, beige, taupe, pink, purple or blue anywhere.
- Objects are matte WHITE, like coated-paper models or white porcelain. Never grey clay, never beige clay.
- Jade green #14E0A0 is a solid surface color on the one active part: a clearly visible color block. It is not a glow and not a thin line.
- Light: soft daylight studio light from the upper left, short soft shadows, no hard black shadows.
- No humanoid figures, no robots, no mannequins. Show a step or a role through its object: a stamp for sign-off, a switch for a decision, a bell for an alert, an archive box for review.
- image_gen saves to ~/.codex/generated_images/<your session id>/. Take files from YOUR session's directory only, never "the newest file" under generated_images (other runs may be writing there in parallel). You MUST cp each file to its exact target path, then run `ls -l` and `sips -g pixelWidth -g pixelHeight` on it. Exit 0 does not mean the file exists.

IMAGE 1 — COVER (wordless)
Target: <repo>/site/src/content/notes/media/<slug>-cover.png
16:9, at least 1200x675.
Background: one seamless pale mint studio backdrop (#D6F7EC), evenly lit, wall and floor the same color with no horizon line.
Subject: ONE hero object group that belongs to this article only. <主物体。哪个部件是翡翠绿。至多两个配件。>
The subject sits in the center and fills about two thirds of the frame width. Three-quarter view from slightly above. Empty margin on all sides. It must still read clearly at 300 px wide.
Do NOT include: a long base slab or plinth, barrier gates, books, desks.
No text of any kind, no letters, no numbers, no symbols on labels, no logo, no watermark, no UI.

IMAGE 2 — BODY FIGURE (labeled, <pipeline | cycle | hub | before-after | layer stack>)
Target: <repo>/site/src/content/notes/media/<slug>-fig.png
16:9.
Background: clean bright cool white (#F4F6F5), evenly lit. Not grey, not beige, not pink.
Objects: matte white solids with thin ink-green outlines (#0A1F1C). The active part of each station is solid jade green #14E0A0. Arrows are solid deep green #06805A, thick enough to see at 600 px wide.
Scene: <按结构逐个写物体、位置和箭头方向>
Exactly <N> Simplified Chinese labels on large white printed callout plates with a thin ink-green border, horizontal, dark ink-green text, one plate next to each station, away from the image edges. No other text, no numbers, no English:
- <标签1>
- <标签2>
- <标签3>

IMAGE 3 — ENGLISH BODY FIGURE (labeled)
Target: <repo>/site/src/content/notes/media/<slug>-fig-en.png
16:9.
Same background, objects, layout and arrows as IMAGE 2. The only change is the labels: exactly <N> English labels on the same white callout plates, in the same positions and order. No Chinese characters, no other text, no numbers:
- <label 1>
- <label 2>
- <label 3>

After all images exist:
1. Run `ls -l` and `sips -g pixelWidth -g pixelHeight` on every target.
2. Look at each image. Regenerate it and overwrite the target if any of these is true: a label character is wrong, garbled or cropped; a color outside the palette appears; the image is dark or greyish; a humanoid figure or robot appears; the cover contains any text or symbol.
3. Do not edit MDX. Do not git commit.
```

运行（后台跑必须带 `< /dev/null`，否则卡在读 stdin）：

```bash
codex exec -C <repo> -s workspace-write --skip-git-repo-check --ephemeral "$(cat prompt.txt)" < /dev/null > gen.log 2>&1
ls -l site/src/content/notes/media/<slug>-*.png   # 别信退出码
```

QA 通过后入库。图片本身不进 git(存在 R2,见 `docs/media-r2.md`):

```bash
cd site && pnpm media:push      # PNG 转成 WebP 并删掉 PNG,上传到 R2,生成 .r2 指针
git add src/content/notes/media/<slug>-*.webp.r2
```

mdx 里引用的是转换后的文件:`cover: ./media/<slug>-cover.webp`、`import fig from './media/<slug>-fig.webp'`。重做图也是同一套:让 codex 重新出 PNG 到原路径,再 `pnpm media:push`。

## 4. 写标签的规则

- 中文标签每个 2–6 个汉字，写具体动作或物体：`挂起签字`、`月底核账`。不写 `输入阶段`、`验证阶段` 这类抽象词。
- 英文标签每个 1–3 个词：`Hold and sign`、`Month-end check`。
- 标签数量 3–5 个。超过 5 个会挤，模型开始糊字。
- 解释性句子放在正文或 `<Figure caption>`，不放进图里。
- 糊字时先缩短标签，再把位置写死（左上 / 正上 / 右上 / 下方居中）。

## 5. 已验证的样例

2026-11-17 用本页口径出图，输出都是 1672×941。括号里是平均亮度。

| 笔记 | 封面的 Subject | 配图结构与标签 |
| --- | --- | --- |
| `hazmat-label-ai-check` | 低矮白色托盘上两只白色化工桶和一只白色方罐，各贴一块空白菱形标牌；前面那只桶的标牌是翡翠绿；一把白色手持扫码枪对着它，镜头圈深绿。(234) | pipeline：`四样比对`、`挂起签字`、`清单联查`、`拦发复盘`。(230) |
| `energy-contract-ai-peak-clause` | 白色托盘上约九根白色圆角柱组成一天的负荷柱状图；最高的一根是翡翠绿，顶穿一根深绿色水平限位线；旁边一只表盘空白的白色电表。(236) | cycle：`条款拆项`、`预警派发`、`压降决策`、`月底核账`。(227) |
| `wip-aging-ai-escalate` | 一段白色辊道上四只白色敞口料箱；一只停在大沙漏下，这只箱和沙漏里的沙是翡翠绿；旁边一根细白杆顶着深绿信号灯。(231) | — |
| `agents-md-monorepo-ownership` | 一张竖立的白色文件页，横切成上下三段，像抽屉一样略微拉开；中间一段是翡翠绿；每段右边用深绿细绳挂一块空白小吊牌；前面一枚白色回形针。(232) | layer stack：`根目录规则`、`子目录规则`、`临时覆盖`、`代码审查`(231)；英文版 `Root rules`、`Subdirectory rules`、`Temporary override`、`Code review`(233) |

前三篇是封面、配图分开跑的。最后一篇用 §3 的完整模板一次跑出封面、中文配图、英文配图三张，标签逐字正确，英文配图与中文配图构图一致。

试过把封面背景换成整面翡翠绿 `#14E0A0`（亮度 189）：单张醒目，排进列表页过于抢眼，没有采用。

## 6. 交付前 QA

逐张看图，以下任一不满足就重出：

- 整张是亮的：封面是浅薄荷底，配图是冷白底，没有发灰、发粉、发黑。
- 只有调色板里的颜色，没有混入橙、铜、棕、米、蓝。
- 没有小人和机器人；封面只有一个主物体，没有长条底座。
- 中文（或英文）标签与提示词逐字一致，没有错字、糊字、多余文字；封面上没有任何字和符号。
- 主体和标签没被裁切。
- 无 logo、水印、UI 界面。
- 缩到卡片大小（约 300px 宽）仍能看懂主体。
- 和最近几篇的封面放在一起，能一眼分出来。

亮度可以量。低于 210 说明底色发灰或暗色面积太大：

```bash
cd site && node -e "import('sharp').then(async ({ default: sharp }) => { for (const f of process.argv.slice(1)) { const { channels: c } = await sharp(f).stats(); console.log(Math.round(0.2126 * c[0].mean + 0.7152 * c[1].mean + 0.0722 * c[2].mean), f); } })" src/content/notes/media/<slug>-*.png
```

通过后先 `pnpm media:push`，再在 frontmatter 写 `cover: ./media/<slug>-cover.webp`，正文 `import` 配图(同样是 `.webp`)后用 `<Figure src={...} width="wide" border />`。构建时 Astro 自动转 WebP，OG 图另导 JPEG，不需要手动处理。
