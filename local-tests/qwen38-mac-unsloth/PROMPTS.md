# Qwen3.8 Mac / Unsloth 笔记配图

## 目标

- 封面：无字头图，一眼看出「本机统一内存上坐着一个本地模型」。
- 正文图：按内存选量化，再加载、再开聊的四步流水线。
- 强调色用站点橙 `#E9961A`，不用技能默认 IKB 蓝。

## 封面最终提示词

```text
Use case: stylized-concept. Asset type: 16:9 landscape blog header illustration for a technology article about running a 27B local language model on Apple Silicon unified memory. Primary request: A single quiet studio still life. A compact pale-gray laptop chassis representing a Mac sits on an off-white tabletop. On its keyboard deck rests one precise 3D model cube, the local 27B weights, with a warm amber-orange core (#E9961A). Beneath the laptop, a thin translucent memory slab is physically continuous with the machine, showing unified memory. One short orange connector runs from the slab into the cube. The thumbnail must read immediately as: one local model sitting on unified memory. Scene/backdrop: quiet off-white studio tabletop, no scenery, generous empty space around the object. Style/medium: clean Swiss editorial 3D vector-like material illustration, small physical models, black ink outlines, refined white and light-gray surfaces, one vivid site-orange accent (#E9961A), soft contact shadows. Composition/framing: wide 16:9, single hero object, centered vertically, generous safe margins on all sides, no crop, designed as an article cover. Lighting/mood: crisp studio light, calm, technical, credible. Constraints: no words, no letters, no numbers, no logos, no Apple logo, no bitten-apple mark, no trademarks, no watermark, no fake app chrome, no page title, no decorative blobs, no gradient background, no people, no cute characters, no UI screens.
```

## 正文图最终提示词

```text
Use case: stylized-concept. Asset type: 16:9 labeled material illustration for a Chinese technology tutorial about running Qwen3.8 locally on a Mac. Primary request: Left-to-right pipeline of four small physical models on an off-white studio table. Station 1: stacked pale-gray memory slabs. Station 2: a compact orange selector block choosing one smaller weight brick from a short row of bricks. Station 3: the chosen brick sliding into a pale-gray laptop. Station 4: a small speech-bubble block for chat. Warm orange arrows (#E9961A) connect the four stations in order. Chinese labels: Add exactly four short Simplified Chinese labels as large printed callouts on quiet white plates, horizontal, high contrast, away from all edges: "看内存", "选量化", "本地加载", "开聊". Place "看内存" above the memory slabs, "选量化" above the selector, "本地加载" above the laptop, "开聊" above the speech bubble. Style/medium: clean Swiss editorial 3D vector-like illustration, off-white background, black ink lines, refined gray surfaces, one vivid site-orange accent (#E9961A). Composition/framing: 16:9 composition, subject fills the width naturally, centered vertically, generous safe margins on all sides, full subject visible, no crop. Lighting/mood: crisp studio light, calm analytical mood. Constraints: no extra words beyond the four specified Chinese labels, no English labels, no numbers, no logo, no watermark, no poster frame, no page title, no decorative blobs, no gradient background, no people, no cute characters, no Apple logo.
```

正文图第一版在内存块表面多印了「看内存」，已用 image_edit 去掉物体上的字，只保留四块白标注板。

## 英文正文图

同一构图，仅把四块标注改成：`Check RAM` / `Pick quant` / `Load local` / `Start chat`。无汉字。

- 源图：`assets/qwen38-mac-unsloth-fig-en-source.png`
- 站点：`site/src/content/notes/media/qwen38-mac-unsloth-fig-en.png`

## 产物

- 封面源图：`assets/qwen38-mac-unsloth-cover-source.png`（1280×720）
- 正文源图：`assets/qwen38-mac-unsloth-fig-source.png`（1280×720）
- 站点封面：`site/src/content/notes/media/qwen38-mac-unsloth-cover.png`
- 站点正文图：`site/src/content/notes/media/qwen38-mac-unsloth-fig.png`

## QA

- 封面无字、无 Apple 标志、无水印；缩略图能看出本机 + 模型块 + 统一内存板。
- 正文图四标签为「看内存 / 选量化 / 本地加载 / 开聊」，字未糊、未贴边。
- 内存块表面无多余汉字。
- 全套只用站点橙，无 logo。
