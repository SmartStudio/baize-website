# 白泽明理设计系统 · Baize Design System

> 克制、冷静、可验证。视觉冲击来自符号与留白，而不是把字放大加粗。

单一事实源（single source of truth）。所有 token 定义在 `tokens/*.css`，本文件说明**为什么**与**怎么用**。可视化版本见 `design-system.html`。

---

## 1. 原则 Principles

每一条都是"拿走东西"，而不是加东西。这是本系统与模板的根本区别。

1. **符号优先** — 冲击来自白泽 mark 与巨量留白，不靠大字重。文字保持克制。
2. **冷灰纪律** — UI 只用冷灰阶（`#111827`→`#E5E7EB`）；品牌蓝橙只活在 logo/插画里，不进普通界面。
3. **一个火花** — 全站只有一个强调色：橙 `#E9961A`。用在最该被看见的地方（价值终点、当前状态、hover）。
4. **全锐角** — 按钮、卡片圆角为 `0`。只有工具 chip 用胶囊形。
5. **巨量留白** — 留白是主要材料。宁可空，不要挤；纠结间距时优先选大一档。
6. **可验证** — 信息要能被证明：数字、SOP、样例优先于形容词。

---

## 2. 对标基准 Reference（sakana.ai 实测值）

用 `getComputedStyle` 抓取，作为本系统的校准锚点：

| 参数 | sakana / fugu 实测 | 本系统采用 |
| --- | --- | --- |
| 主字体 | `Poppins`（+ Noto Sans JP 正文） | Poppins + Noto Sans SC |
| 首屏 h1 | `46.8px / 500 / -1.4px` tracking | 47px / 600 / -0.02em |
| 正文 | `13.5–16px / 400`，灰 `#6B7280` | 16px / 400 / `#6B7280` |
| 副标题 | 极细 `weight 200` | Lead `weight 300` |
| 文字色 | `#111827`（slate-900） | `#111827` |
| 边框 | `#E5E7EB` / `#D1D5DB` | 同 |
| 主按钮 | 实心 `#111827`，**圆角 0** | 同 |
| 强调色 | 单一红 `#CC2B2B`，极少量 | 单一橙 `#E9961A`（品牌版红） |

**关键领悟**：sakana 首屏几乎没有大字——最大文字仅 22px 极细副标，那个巨大的 "sakana.ai" 是**图形 logo**。冲击来自"图形 + 留白"，不是"放大加粗"。

---

## 3. 颜色 Color

品牌色只用于 mark；界面用冷灰阶；橙是唯一强调火花。

### Neutral（界面主体）
| Token | Hex | 角色 |
| --- | --- | --- |
| `--bz-ink-900` | `#111827` | 正文 / 主按钮 |
| `--bz-ink-700` | `#374151` | 深次级 |
| `--bz-gray-500` | `#6B7280` | 次级正文 |
| `--bz-gray-400` | `#9CA3AF` | 弱化 / 标注 |
| `--bz-gray-300` | `#D1D5DB` | 强边框 |
| `--bz-gray-200` | `#E5E7EB` | 细线分隔 |
| `--bz-paper-100` | `#F7F8FA` | 交替区块底 |
| `--bz-white` | `#FFFFFF` | 页面 / 卡片 |

### Accent（唯一火花）
| Token | Hex | 角色 |
| --- | --- | --- |
| `--bz-accent` | `#E9961A` | 强调 / hover / rule / 当前状态 |
| `--bz-accent-strong` | `#B4740B` | 白底上的橙色文字（对比达标） |
| `--bz-orange-100` | `#FBEACF` | 徽章底色 |

### Brand（仅 logo / 插画）
`--bz-logo-navy #071E5B` · `--bz-logo-blue #0F62B5` · `--bz-logo-sky #28A8DF`。**不用于普通 UI。**

**规则**：一个页面里橙色出现次数应能一只手数完。不要同时出现红/橙/蓝多个强调色。

---

## 4. 排版 Typography

- **Display / 标题**：`--bz-font-display` = `Poppins, "Noto Sans SC", …`
- **正文 / UI**：`--bz-font-sans` = 同上（Poppins-led，CJK 落 Noto Sans SC）
- **标签 / 元信息**：`--bz-font-mono` = `JetBrains Mono`（仅英文/数字标签）

| 级别 | 字号 | 字重 | 字距 | 用途 |
| --- | --- | --- | --- | --- |
| Display | 64px | 600 | -0.02em | 品牌字标场景 |
| H1 | 47px | 600 | -0.02em | 页面主标题 |
| H2 | 30px | 700 | -0.01em | 区块标题 |
| H3 | 19px | 600 | — | 卡片标题 |
| Lead | 22px | **300** | — | 首屏副标（极细） |
| Body | 16px | 400 | — | 正文，行高 1.65 |
| Small | 14px | 400 | — | 次要正文 |
| Label | 12px | 500 | 0.12em | mono 技术标签，大写 |

**规则**：
- 大标题字距一律收紧为负值（-0.01 ~ -0.02em）。
- 副标/lead 用 300 极细，与标题形成"轻—重"对比，而不是都加粗。
- 含中文的导航/正文一律用无衬线；等宽字**只**放纯英文/数字标签（等宽字无 CJK 字形，中文会回退错位）。

### 字标 Logotype（白泽明理）

品牌名"白泽明理"不当普通文字排，用 `.bz-logotype` 叠加类做成定制字标。四个杠杆（前三个由 token 控制）：

| 杠杆 | Token / 值 | 作用 |
| --- | --- | --- |
| 字重 | `--bz-logotype-weight` = 600 | 品牌 display 字重 |
| 字距 | `--bz-logotype-track` = -0.03em | 把四字拉拢成一个整体 |
| 描边 | `--bz-logotype-stroke` = 0.4px | 光学加粗，笔画像"刻"出来而非"打"出来 |
| 收字 | `font-feature-settings: "palt"` | **关键**：汉字用真实字面宽度而非全角方格 |

`palt` 是中文字标脱离"排版文字"的核心动作：默认每个汉字占固定方格、字间留方格余白，看起来就是打出来的文本；`palt` + 负字距让四字收拢成被设计过的单元。

- **用法**：叠加到品牌名元素上（`bz-logotype` 与宿主类共存），只接管字重/字距/描边/收字，字号与颜色仍归宿主。已应用于两个 hero 标题、topbar 与 site-header 字标。
- **`--stamp` 变体**：尾随一枚橙色印章点，呼应涂鸦印章。是唯一的"火花"，仅用于品牌识别尺度，不滥用。

---

## 5. 间距与布局 Spacing & Layout

4pt 基准刻度：`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 56 / 64 / 72 / 88 / 104 / 128`。

| 语义 token | 值 | 用途 |
| --- | --- | --- |
| `--bz-page-max` | 1280px | 页面内容宽 |
| `--bz-read-max` | 760px | 可读行宽 |
| `--bz-rail-col` | 184px | 长页左侧 rail 标签列 |
| `--bz-page-gutter` | 48px（移动 20） | 页面侧边距 |
| `--bz-section-y` | clamp(84,8vw,128) | 大区块纵向节奏 |
| `--bz-stack-gap` | clamp(20,3.5vw,48) | 纵向堆叠间距 |
| `--bz-cell-pad` | 28px | 网格 cell 内边距 |

**规则**：容器外边距默认 = 内部元素 gap。信息块优先用 hairline 分隔 + 网格单元；卡片只用于文章/案例等重复项，不包裹整页大区块。

---

## 6. 形态 · 深度 · 动效 Shape / Elevation / Motion

- **圆角**：默认 `0`（`--bz-radius-*` 全为 0）；胶囊 `--bz-radius-pill` 仅工具 chip。
- **深度**：来自背景色阶 + 1px 细线，**不用阴影**。唯一例外：悬浮的 mark 用 `--bz-shadow-mark`。
- **动效**：统一缓动 `cubic-bezier(0.2,0,0,1)`；fast 140 / base 220 / slow 480ms。Hover 只做颜色/边框/细橙线变化，不做明显上移。尊重 `prefers-reduced-motion`。

---

## 7. 图标与涂鸦 Iconography & Doodles

- **功能图标**：单线、2px 描边、圆角端点（放大镜 / 网格 / 层叠等），用于流程节点与 UI。
- **手绘涂鸦**：云 / 山 / 水 / 火花 / 印章——在留白里注入人格，取代机械科技网点。极淡灰 `--bz-doodle-line #E5E7EB`；印章用橙。这层是纯内联 SVG（`.bz-doodles`），零依赖、可增删。
- 涂鸦与功能图标共用同一套线条语言（方形节点呼应印章、线性图标呼应云山），保证"图形"与"人格"是同一种视觉语言。

---

## 8. 组件 Components

所有组件优先用 token，不写裸色值/裸像素。

| 组件 | 规格要点 |
| --- | --- |
| **Button** | 锐角；`primary` = 实心 `#111827`/白字；`secondary` = 白底 `#D1D5DB` 描边；`sm/lg` 变体；14px/600；min-height 48。 |
| **Badge** | 锐角；mono 字；`neutral / jade(信任) / gold(强调)` 三色，均低饱和。 |
| **Card** | 1px 边框、无阴影、无圆角；hover 边框转 `#111827`。仅用于重复项。 |
| **SectionHeader** | display 字标题 + mono eyebrow；eyebrow 用 muted 灰，rail-bar 用橙。 |
| **Flow** | 三段管线：方形节点 + 线性图标 + mono stage + 标题 + 橙色 `输出·`；末节点橙色（价值终点）。 |
| **Logowall** | works-with 灰度 wordmark 条 + mono 标签；hover 转 ink。 |
| **Hero（两个模板）** | ① `bz-brand-home`：居中对称品牌 splash（mark 在标题上方）。② `bz-hero-split` + `bz-topbar`：左对齐非对称（左文右图，fugu 式），mark 放大成右侧主视觉。纯品牌页用 ①，B2B 落地/转化页用 ②。 |
| **SiteHeader / brand-home nav / topbar** | 含中文的导航用无衬线 15px/500；纯英文元信息用 mono 12px。`bz-topbar` 是 split hero 的配套头（品牌+eyebrow 左，导航右）。 |
| **Logotype** | `bz-logotype` 叠加类：定制"白泽明理"字标（palt 收字 + -0.03em 字距 + 600 字重 + 0.4px 描边）。`--stamp` 变体加橙色印章点。详见 §4 字标。 |
| **ServiceTier** | `bz-tier`：服务总览的三层价值阶梯分组（接入 → 工程 → 交付）。`__step` 橙色 mono 层级标 + `__name` display 层级主张；`bz-tier--end` 把末层收束成满宽单卡（去 min-height + 限行宽）。 |
| **Cell 输出行** | `bz-cell__out`：cell 内的「交付物 · …」行，橙色 mono，复用 Flow `__out` 的输出语言，表达"这个服务产出什么"。 |

---

## 9. 该做 / 不该做 Do / Don't

**Do**
- 用符号 + 留白造冲击；文字保持克制。
- 界面只用冷灰阶；品牌蓝橙留给 logo。
- 橙色只做唯一点睛，用在价值终点。
- 按钮、卡片一律锐角。
- 大标题字距收紧为负值。

**Don't**
- 用超粗超大字重（800/900）硬凑气势。
- 用暖纸底或纯白之外的杂色底。
- 同时出现红/橙/蓝多个强调色。
- 圆角按钮、投影卡片。
- 装饰性科技网点 / 星座连线背景。

---

## 10. 文件地图 Token Map

| 文件 | 内容 |
| --- | --- |
| `styles.css` | 入口，只 `@import` tokens |
| `tokens/colors.css` | 颜色角色 + 别名 |
| `tokens/typography.css` | 字体、字阶、字重 token |
| `tokens/spacing.css` | 间距刻度 + 语义布局 |
| `tokens/effects.css` | 圆角、阴影、动效 |
| `tokens/components.css` | 全部组件样式 |
| `design-system.html` | 可视化规范（本文件的渲染版） |
| `guidelines/*.card.html` | 单项 foundation 预览卡 |
| `ui_kits/website-home/` | 应用样例（首页） |

## 11. 应用与遗留 Notes

- 修改设计语言 → 只改 `tokens/`，全站自动派生。不要在页面里写裸值。
- 已移除：`--bz-fugu-red`（红主色，别名仍保留兼容）、`baize-field.js` 科技网点场——由冷灰系统 + 手绘涂鸦取代。
- 待补齐：横版 logo、favicon、真实案例素材、自托管字体文件（当前走 Google Fonts CDN，生产建议自托管）。
