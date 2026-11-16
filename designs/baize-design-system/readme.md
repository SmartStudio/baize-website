# Baize Tech Design System

白泽明理 Baize Tech 的官网设计系统，用于生成品牌官网、服务页、明理笔记、方法论页、案例页、联系页，以及后续 HTML 原型。

> **单一事实源：[`DESIGN.md`](./DESIGN.md)**（原则 + token 表 + 组件规则）。可视化规范见 [`design-system.html`](./design-system.html)。本 README 提供产品与内容上下文；视觉规范以 `DESIGN.md` 为准。

## Sources

- 用户提供的品牌 brief：Formal eXplainable AI（白泽明理）、使命、核心服务与内容宣传需求。
- 参考网站：[Sakana AI](https://sakana.ai/) 与 Sakana Fugu 产品页的极简品牌首屏、可交互图形场、克制导航、强符号表达、红色主强调、产品页 rail/grid 信息结构。
- 用户提供的正式 Logo：仓库根目录 [`../../白泽明理.png`](../../白泽明理.png)。
- 设计系统已派生 `assets/baize-logo-lockup.png` 与 `assets/baize-mark.png`，分别用于对外物料锁定图和网页品牌符号场景。

## Product Context

白泽明理不是普通 AI 工具站，也不是泛泛培训机构。它面向企业、小团队和个体用户，帮助他们理解 AI、普及 AI、落地 AI、应用 AI，不因为 AI 落后于人。

核心服务是一条从接入到交付的价值阶梯（设计口径，白泽只设计不下场）：

- 接入：Codex 中转站搭建、LLM API 网关设计。
- 工程：AI 研发流设计、Loop Engineering 设计。
- 交付：想法到产品端到端交付设计。

AI 编程培训与 Skills 沉淀为支撑层，不单列为主服务。真相源见 `docs/requirements.md` v2。

官网第一版的目标是建立可信品牌认知、解释服务边界、承接内容宣传，并推动咨询转化。

## Content Fundamentals

### Voice

文案要像“解释复杂问题的专家”，不是“卖概念的营销站”。

语气：

- 清楚。
- 克制。
- 有判断。
- 专业但不晦涩。
- 直接指出真实问题。

推荐表达：

- 让复杂 AI 变得可解释、可验证、可落地。
- 不只是买工具，而是建立组织级 AI 使用能力。
- 把个人经验沉淀成团队可复用的 Skills。
- 帮团队从尝鲜 AI 走向稳定使用 AI。
- 安全、稳定、可控地接入 AI。

避免表达：

- 颠覆行业。
- 赋能万物。
- 革命性效率提升。
- 一站式 AI 解决方案。
- 账号代购。
- 代理服务。

### Language Rhythm

- 中文为主，英文只做概念辅助。
- 标题要短，尽量是判断句或结果句。
- 正文优先解释“为什么需要”和“交付什么”。
- CTA 文案必须具体，例如“预约 AI 落地诊断”，不要只写“了解更多”。

## Visual Foundations

### Brand Motif

主视觉概念：

> 白泽在复杂信息迷雾中梳理出可解释路径。

可用元素：

- 白泽神兽线稿（第一识别资产）。
- 印章式字标 / 橙色印章涂鸦。
- 手绘涂鸦人格层：云 / 山 / 水 / 火花（极淡灰，散落留白）。
- 单线功能图标（2px stroke）与结构化流程节点。
- 解释路径 / 低对比度数理符号。
- 橙色 `#E9961A` 关键点睛。
- Logo 蓝色与天蓝色仅在 logo/插画中出现。

不要使用：

- 大面积蓝紫渐变。
- 赛博粒子背景。
- 机器人形象。
- 随机发光球。
- 过度卡通化吉祥物。

### Color

主背景纯白，界面只用冷灰阶（`#111827`→`#E5E7EB`，对齐 sakana 实测 slate）。**唯一强调色是橙 `#E9961A`**（点睛、hover、当前状态、价值终点），品牌深蓝 `#071E5B` 与天蓝只活在 logo/插画里、不进普通 UI。旧版的 Fugu 红 `#E10600` 已退役。详见 `DESIGN.md` §3。

### Type

`Poppins` + `Noto Sans SC`（经 Google Fonts，生产建议自托管），`JetBrains Mono` 仅用于英文/数字标签。字阶克制：首屏 h1 ≈ 47px/字重 600、大标题字距收紧为负值、副标用极细 300。冲击靠符号与留白，不靠字重。品牌名"白泽明理"用 `.bz-logotype` 做成定制字标（palt 收字 + 负字距 + 描边），不当普通文字排。详见 `DESIGN.md` §4。

### Layout

- 首页首屏采用 Sakana 首页语法：顶部轻导航、中心白泽 mark、外围图形场、中文品牌名、短主张、底部 utility，不在首屏堆服务卡片。
- 服务、方法论、案例和内容页采用 Fugu 产品页语法：sticky header、左侧 rail label、右侧正文、1px cell grid。
- 页面最大宽度为 1280px，长页 rail 左列约 184px。
- 信息块优先使用 hairline 分隔和网格单元，不使用浮动卡片墙。
- 卡片只用于文章、案例等重复项，不包裹整页大区块。

### Motion

动效只服务理解：

- Hover 只做颜色 / 边框 / 细橙线变化，不做明显上移。
- CTA 颜色过渡。
- cell 底部橙线随 hover 展开；文字链箭头右移。
- 流程线渐进；页面轻微淡入。
- 手绘涂鸦可极缓慢漂移（可选）。

避免高对比、满屏、无语义的无限循环装饰动画和复杂 3D。

## Iconography

当前已有正式 Logo 资产。第一版建议：

- 基础 UI 图标使用 Lucide 或同等 1.75px-2px stroke 的线性图标。
- 首页和小尺寸场景使用 `assets/baize-mark.png` 搭配文本字标；完整锁定图 `assets/baize-logo-lockup.png` 只用于对外物料或品牌卡片，避免在网页首屏被竖版比例撑爆。
- 不使用 emoji 作为服务图标。
- 不手绘复杂 SVG 替代正式品牌资产。

## Components

本系统包含以下基础组件：

- `Button`：主按钮、次按钮、Ghost 按钮。
- `Badge`：服务、内容分类和状态标签。
- `Card`：服务卡片、文章卡片、案例卡片的基础容器。
- `SectionHeader`：页面板块标题。
- `SiteHeader`：官网顶部导航。
- `ContactForm`：咨询表单。
- CSS layout primitives：`bz-brand-home`（居中 hero）、`bz-hero-split` + `bz-topbar`（非对称 hero）、`bz-product-hero`、`bz-rail-section`、`bz-cell-grid`，用于首页和长页模板。
- `bz-logotype`：定制"白泽明理"字标叠加类（palt 收字 + 负字距 + 描边），`--stamp` 变体加橙色印章点。
- `bz-doodles` / `bz-doodle-*`：首页手绘涂鸦人格层（内联 SVG，零依赖）。
- `bz-flow`：方法论流程示意图；`bz-logowall`：works-with 工具信任条；`bz-proof-strip`：信任线索三栏。
- `bz-tier`：服务总览的三层价值阶梯分组（接入/工程/交付），`--end` 收束末层为满宽单卡；`bz-cell__out`：cell 内橙色「交付物 · …」行。
- 已移除：`assets/baize-field.js` 科技网点场（由手绘涂鸦层取代）。

组件应优先使用 CSS tokens，不在组件里写裸色值或裸像素。

## Website Templates

### Homepage

首屏有两个可选模板（`ui_kits/website-home/`）：

- **模板 ① 居中 splash**（`index.html` · `.bz-brand-home`）：品牌优先，居中对称。
- **模板 ② 左对齐非对称**（`index-fugu.html` · `.bz-hero-split` + `.bz-topbar`）：fugu 式，左文右图，是一条完整长页（hero → 工具信任条 → 服务 → 方法论 → 证据 → 联系），转化/落地更强。

纯品牌页用 ①，B2B 落地页用 ②。两版品牌名均以 `.bz-logotype` 定制字标渲染。

模板 ① 顺序：

1. Top nav（含中文项用无衬线，元信息用 mono）
2. 手绘涂鸦人格层（云/山/水/火花/橙印章）
3. Centered Baize mark
4. Chinese brand name（≈78px / 600，不再超粗）
5. One-line brand proposition（极细 300 副标）
6. 锐角双按钮 CTA + bottom utility

### Services

顺序：

1. Sticky product-style header
2. Product/service hero
3. Rail section: What is
4. Rail section: Services with 1px cell grid
5. Rail section: Method
6. Rail section: Notes / Cases
7. Contact CTA

### Baize Notes

顺序：

1. 栏目标题
2. 分类筛选
3. 精选文章
4. 文章列表
5. 咨询 CTA

## Files

- `DESIGN.md`：视觉规范单一事实源（原则 + token 表 + 组件规则）。
- `design-system.html`：可视化规范页（DESIGN.md 的渲染版）。
- `styles.css`：全局样式入口，只包含 `@import`。
- `tokens/`：色彩、排版、间距、效果与组件样式。
- `components/core/`：核心 React 组件与组件卡片。
- `guidelines/`：Foundation 预览卡片。
- `ui_kits/website-home/`：官网首页起点。
- `preview.html`：本地页面模板画廊（iframe 聚合）。
- `SKILL.md`：将该设计系统作为 Agent Skill 使用的说明。
- `_ds_bundle.js` / `_ds_manifest.json` / `_adherence.oxlintrc.json`：技能生成的组件注册表与规范校验（勿手改）。

## Caveats

当前版本已经接入正式 Logo，但仍缺少横版 Logo、品牌插画和字体文件。正式设计前建议补齐：

- 横版 Logo。
- 方形头像 / favicon。
- 图标规范。
- 真实案例素材。
