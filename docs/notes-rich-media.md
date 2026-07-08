# 明理笔记 · 富媒体写作速查

笔记正文是 MDX，除了普通段落/标题/列表，还能直接用下面这套组件加**图、图注、视频、图组、提示框、代码块**。组件已在 `src/pages/notes/[...slug].astro` 里通过 `components` 注入，**MDX 里直接写标签即可，不用 import**。

设计规则统一：直角、发丝线边框、灰色小字图注、单一橙色火花，和全站一致。

> **图片怎么来(项目约定)**：明理笔记的**封面和正文配图统一用 `guizang-material-illustration` 技能生成**(Guizang 3D 物料/瑞士编辑风,统一站点橙 `#E9961A`),不手写 SVG、不用裸提示词。
> - 正文配图 = 带中文标签的概念图(cycle/pipeline/hub/before-after);封面 = 无字的单一主视觉头图,两者互补。
> - 出图:`codex exec ... "<让它用内置 image_gen 一次性出图>"`;中文标签给白色标注板就不糊;逐张 QA 后放进 `src/content/notes/media/`。
> - 详见仓库根 `CLAUDE.md` 的「明理笔记配图」小节。下面讲的是把图**接进笔记**的写法。

---

## 1. 封面（列表卡缩略图 + 文章头 hero）

在 frontmatter 里加两行。图片和 `.mdx` 放一起（建议放 `./media/` 子目录），构建期自动优化成 WebP + 响应式多尺寸：

```yaml
---
title: ...
cover: ./media/your-cover.png     # 相对本文件的路径;png/jpg/webp
coverAlt: 封面的替代文字（无障碍/SEO）
---
```

- 有封面 → 列表卡顶部出现 16:9 缩略图，文章头出现宽版 hero。
- **不写 cover → 自动回退成纯文字卡**，不会报错。
- 封面尺寸建议 1200×675（16:9）以上。

## 2. 配图 + 图注 `<Figure>`

**优化图片（截图/照片，推荐）**——先 import 再用，走 Astro 优化：

```mdx
import shot from './media/dashboard.png'

<Figure src={shot} alt="后台看板截图" caption="图 1：统一的用量看板" />
```

**SVG 示意图 / public 里的图**——直接传字符串路径（SVG 不需要栅格优化）：

```mdx
<Figure src="/notes-media/diagram.svg" alt="架构图" caption="图 2：调用链路" width="wide" border />
```

`<Figure>` 的参数：

| 参数 | 取值 | 说明 |
|---|---|---|
| `src` | 导入的图片 / 字符串路径 | 导入的走优化;字符串按原样渲染 |
| `alt` | 文本（必填） | 替代文字 |
| `caption` | 文本 | 图注，灰色小字，居中 |
| `width` | `content`(默认) / `wide` / `full` | wide/full 会**溢出到比正文更宽**并居中 |
| `border` | 布尔 | 加一圈发丝线边框（截图/白底图常用） |

## 3. 视频 / GIF 演示 `<Video>`

视频文件放 `public/notes-media/` 下（Astro 不优化视频），`src` 传绝对路径。

```mdx
<!-- 像 GIF 的自动演示:静音、循环、自动播放、无控件 -->
<Video src="/notes-media/agent-demo.mp4" caption="Agent 自动改 bug 的过程" autoplay />

<!-- 需要用户手动播放的长视频:默认带控件 -->
<Video src="/notes-media/walkthrough.mp4" poster="/notes-media/walkthrough-poster.jpg" caption="完整演示" />
```

参数：`src`(必填)、`poster`(封面帧)、`caption`、`autoplay`(静音循环)、`controls`、`width`(同 Figure)。
> 提示：`autoplay` 会自动静音循环，体积比 GIF 小一个数量级，优先用它替代 GIF。

## 4. 图组 / 对比图 `<Figures>`

2~3 张并排，窄屏自动塌成单列。里面直接放 `<Figure>`（用默认宽度即可）：

```mdx
<Figures columns={2}>
  <Figure src={before} alt="改造前" caption="改造前" />
  <Figure src={after} alt="改造后" caption="改造后" />
</Figures>
```

参数：`columns`(2 或 3，默认 2)、`width`(默认 wide)。

## 5. 提示框 `<Callout>`

```mdx
<Callout type="tip" title="一个判断信号">
正文……可以有 **加粗**、[链接](/services) 等。
</Callout>
```

`type`：`note`(灰) / `tip`(橙) / `warning`(橙底强调)；`title` 可选。

## 6. 代码块

普通 Markdown 围栏代码块即可，已配置 **Shiki `github-light` 浅色主题** + 站点风格的背景：

````mdx
```ts
export const onRequestGet: PagesFunction = async (ctx) => Response.json({ ok: true });
```
````

行内 `code` 也有对应的浅底 + mono 样式。

---

## 文件放哪儿（约定）

```
src/content/notes/
  your-note.mdx
  media/                 ← 该笔记的优化图片(cover / import 的图)
    your-cover.png
public/notes-media/      ← SVG 示意图、视频、poster(不走优化,按原样部署)
  diagram.svg
  demo.mp4
```

## 一条工程注意

`site` 依赖里显式装了 `sharp`（图片优化引擎）。这是因为本仓库位于一个更大的目录树下，祖先目录里有一份**版本更旧的 sharp**，Node 解析时会先撞上它导致构建报 `A boolean was expected`。把 `sharp` 固定成 `site` 的直接依赖后，解析优先命中本地正确版本。**不要删掉 `package.json` 里的 sharp。**
