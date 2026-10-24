# 明理笔记配图 · 提示词模板（白泽青）

每篇笔记出两张图：一张封面（深底、无字），一张正文配图（浅底、带中文标签）。两张都用 `guizang-material-illustration` 技能的风格，经 `codex exec` 调内置 `image_gen` 生成。配色规格见 `docs/design-system.md` §9，项目约定见根目录 `CLAUDE.md`「明理笔记配图」。

2026-10-22 起强调色从站点橙 `#E9961A` 换成翡翠绿 `#14E0A0`。旧提示词（如 `local-tests/chatgpt-contract-paste-vs-redact/gen-images-prompt.md`）里的橙色写法不要再抄。

## 1. 固定口径

| 项 | 封面 | 正文配图 |
| --- | --- | --- |
| 背景 | 深墨绿 `#062A25` | 冷白 `#F4F6F5` |
| 物体材质 | 哑光深绿 + 浅灰 | 浅灰实体 + 黑色细描边 |
| 强调色 | 翡翠绿 `#14E0A0`，作发光点、箭头、激活部件 | 翡翠绿 `#14E0A0` 只做点和面，`#06805A` 做描边细节 |
| 文字 | 无任何文字 | 3–5 个简体中文标签，白色标注板，大字，远离边缘 |
| 比例 | 16:9，≥1200×675 | 16:9 或 1.9:1 |
| 落地路径 | `site/src/content/notes/media/<slug>-cover.png` | `site/src/content/notes/media/<slug>-fig.png` |

共同禁止：logo、水印、英文、数字、UI 界面截图、聊天框、霓虹赛博朋克。封面和配图要互补，不画同一个构图。

## 2. 提示词模板

把 `<…>` 换成该篇内容后整段交给 codex。

```text
You are generating TWO Guizang material illustrations for a 明理笔记.

Read first:
- ~/.codex/skills/guizang-material-illustration/SKILL.md
- ~/.codex/skills/guizang-material-illustration/references/visual-style.md
- ~/.codex/skills/guizang-material-illustration/references/prompt-patterns.md
- ~/.codex/skills/guizang-material-illustration/references/qa-checklist.md
- <repo>/docs/image-prompts.md

Hard rules:
- Use the built-in image_gen tool. No SVG. No ImageMagick or any tool to overlay text.
- Swiss editorial 3D material style, small physical model feel, soft studio light, light contact shadows, full subject visible, generous safe margins.
- Accent color is jade green #14E0A0 only. No orange, no IKB blue.
- image_gen saves to ~/.codex/generated_images/<your session id>/exec-*.png. Take the file from YOUR session's directory only, never "the newest file" under generated_images (other runs may be writing there in parallel). You MUST cp each file to the exact target path, then `ls -l` and `sips -g pixelWidth -g pixelHeight` it. Exit 0 does not mean the file exists.

IMAGE 1 — COVER (wordless)
Target: <repo>/site/src/content/notes/media/<slug>-cover.png
16:9, at least 1200×675.
Background deep ink green #062A25. Objects in matte dark green and light grey. Jade #14E0A0 as a restrained glow on arrows, active parts and light dots. Not neon, not cyberpunk.
Single main visual: <一句话描述主物体与动作，缩略图也能一眼看懂>.
No text of any kind, no numbers, no logo, no watermark.

IMAGE 2 — BODY FIGURE (labeled, <cycle | pipeline | hub | before-after | layer stack>)
Target: <repo>/site/src/content/notes/media/<slug>-fig.png
16:9 or 1.9:1.
Background cool off-white #F4F6F5. Light grey solid objects with thin black outlines. Jade #14E0A0 only on dots, arrows and active surfaces; #06805A for outline details.
Scene: <从左到右 / 环形 / 中心辐射，逐个写物体和流向>.
Exactly <N> Simplified Chinese labels on large white printed callout plates, horizontal, dark text, high contrast, away from edges, no other text:
- <标签1>
- <标签2>
- <标签3>

After both images exist:
1. ls -l both targets and sips their pixel sizes.
2. Inspect each image. If a label is garbled, cropped, or any English appears, regenerate that image and overwrite the target.
3. Do not edit MDX. Do not git commit.
```

运行（后台跑必须带 `< /dev/null`，否则卡在读 stdin）：

```bash
codex exec -C <repo> -s workspace-write --skip-git-repo-check --ephemeral "$(cat prompt.txt)" < /dev/null > gen.log 2>&1
ls -l site/src/content/notes/media/<slug>-*.png   # 别信退出码
```

## 3. 写标签的规则

- 每个标签 2–6 个汉字，写具体动作或物体：`拿掉印章`、`人工审批`。不写 `输入阶段`、`验证阶段` 这类抽象词。
- 标签数量 3–5 个。超过 5 个会挤，模型开始糊字。
- 解释性句子放在正文或 `<Figure caption>`，不放进图里。
- 糊字时先缩短标签，再把位置写死（左上 / 正上 / 右上 / 下方居中）。

## 4. 已验证的样例

2026-10-22 试色，主题为「AI Agent 的工具权限阶梯」，实际输出 1672×941：

- 封面：一座四级 3D 台阶，最高一级放一把带锁的钥匙，翡翠绿光点沿台阶上升。深墨绿底效果好，缩略图可辨。
- 配图：同一台阶，四块标注板从低到高为 `只读`、`起草`、`执行`、`高风险`，顶部标注板 `人工审批` 用翡翠绿箭头指向最高级。冷白底中文清晰。

同一主题浅底、深底各出过一套，对比后定为封面用深底、配图用浅底。

## 5. 交付前 QA

逐张看图，以下任一不满足就重出：

- 中文标签与提示词一致，没有错字、糊字、多余英文。
- 主体和标签没被裁切。
- 只有翡翠绿一种强调色，没有混入橙色或蓝色。
- 无 logo、水印、UI 界面。
- 缩到卡片大小（约 300px 宽）仍能看懂主体。

通过后在 frontmatter 写 `cover: ./media/<slug>-cover.png`，正文 `import` 配图后用 `<Figure src={...} width="wide" border />`。构建时 Astro 自动转 WebP，OG 图另导 JPEG，不需要手动处理。
