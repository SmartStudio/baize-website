# 白泽明理英文站 · 设计

日期:2026-10-23 · 状态:待审

## 1. 意图

白泽明理要进入海外市场,卖的是 AI 转型服务。英文站是获客站:
- **明理笔记(英文)**让海外决策者从 Google / ChatGPT / Perplexity 搜到白泽,建立信任;
- **服务页**说明能做什么,交付方式为**远程为主**;
- **联系**走邮件(`contacts@fxai.ai`),之后加 WhatsApp。

成功的样子:海外读者从一篇英文笔记进站,沿着页内链接到服务页,再到联系页,全程不碰到中文、微信、人民币或只适用于国内的说法。

## 2. 目标 / 非目标 / 反目标

**目标**
- `/en/` 下一套完整英文站:首页、服务、方法论、关于、联系、笔记列表、笔记分类页、英文 `llms.txt`、英文 RSS。
- 67 篇中文笔记全部出英文版,每篇正文配图都重新出**英文标签版**(约 76 张)。封面无文字,中英共用。
- 中英页面互相 hreflang 对照,页头有语言切换。
- 存量补齐后,新的中文笔记**定期批量**补英文(不要求同时上线),要有工具告诉我们缺哪些、哪些过期。

**非目标**
- 不做第三种语言,不做自动语言跳转(按 IP 或 `Accept-Language` 重定向)。
- 不改中文站的任何 URL 和内容口径。
- 不翻译 `fxai/privacy`、`fxai/terms`(那是 api.fxai.ai 的法务页,另一条业务线)。

**反目标(功能做出来了也算失败的情况)**
- 英文页面上出现微信二维码、「微信扫码」、人民币价格、飞书、中文导航或中文报错。
- 英文的 AI 转型笔记把读者导去 fxai API 注册页(现状就是这样,见 §4.1)。
- 英文笔记里的内链跳进 404,或在 GH 镜像下丢掉 base 前缀。
- 机翻腔:逐句直译中文的修辞、对照腔和收束金句。

## 3. 约束(来自现有项目)

- 现有硬约束继续适用于英文笔记:`cover` 必填;OG 图单独导 JPEG;互链只用 `<NoteLink>`;空分类不出归档页;站内 href 给终态地址(带尾斜杠);图片放 `src/assets/` 或 `content/notes/media/`,不放 `public/`;邮箱链接用 `<!--email_off-->` 包住。
- 笔记正文的措辞规则同样适用于英文:每一轮先执行 `Please remove all mannered prose.`。英文里对应要删掉 "It's not X, it's Y"、"The real key is..."、"Here's the thing" 这类句式和收尾金句,写成内部备忘录的口吻。
- 英文配图走 `guizang-material-illustration` 技能 + `codex exec` 出图,规格同中文配图(冷白底 `#F4F6F5`、翡翠绿 `#14E0A0`、`#06805A` 描边、白色标注板),标签换成**英文**,3–5 个。`image_gen` 静默失败、后台必须 `< /dev/null` 的坑见 `website/CLAUDE.md`。逐张 QA:无糊字、无拼写错误、贴题、无 logo 或水印。
- 两个部署产物:GH 镜像 `base=/baize-website/`,所有英文链接都得经过 `BASE_URL` 拼接。
- 改 SEO 相关代码要抓构建产物(`dist/`)验证,不能只读代码。

## 4. 已定的设计

### 4.1 拆开「语言」和「业务线」

现状:`lang === 'en'` 被当成「fxai API 产品线」的开关。`SiteHeader` 的 `NAV_EN` 是 API Home / Models & Pricing / Chinese Notes,Logo 链到 `api.fxai.ai`,CTA 是 "Create an account";`NoteLayout` 里 `isApiArticle = isEnglish && ctaVariant === 'api'`。

改为:
- `lang` 只决定语言:页头页脚、日期格式、分类名、界面文案。
- **业务线由笔记的 `ctaVariant` 决定**(schema 已有 `'consulting' | 'api'`)。`api` 篇的文末 CTA 继续导向 fxai 注册;`consulting` 篇导向 `/en/contact/`。**用户已确认:API 类英文笔记继续引去注册。**
- 英文页头统一用英文官网导航(Services / Notes / Method / About + "Book a call" 之类的 CTA)。`api` 篇的页头也用这套导航,API 导流只靠文末 CTA 和正文。(这一点是 Claude 的判断。)
- **中文页的 CTA 行为不变**。3 篇中文 `api` 笔记现在显示「预约咨询」,这次保持原样,改动只落在英文分支(对应非目标「不改中文站」)。(Claude 的判断。)
- 英文文末 CTA:`consulting` 篇统一链到 `/en/contact/`,不按 `relatedService` 深链到服务锚点。`relatedService` 现存的值还是五项服务时代的(`gateway`/`dev-workflow`/`loop-engineering`/`delivery`…),和 4 个锚点对不上,重新映射不在这次范围内。(Claude 的判断。)

### 4.1a 品牌与实体

- 英文品牌名用 **Baize Tech**(代码里的英文 alt 和 `og:site_name` 已经在用)。
- 英文页头保留 logo 和 `baize` 字标,隐藏中文字标 `白泽明理`(`hd__cn`);标题后缀用 `· Baize Tech`。
- JSON-LD 的 Organization **保持一个实体**:同一个 `@id`,`name` 不变,加上 `alternateName: 'Baize Tech'`,不拆成中英两个实体。`areaServed` 增加全球范围(用户的目标是海外市场)。
- 以上都是 Claude 的判断。

### 4.2 URL 与内容目录

- 英文页面:`/en/`、`/en/services/`、`/en/method/`、`/en/about/`、`/en/contact/`、`/en/notes/`、`/en/notes/category/<slug>/`、`/en/notes/<slug>/`、`/en/llms.txt`、`/en/rss.xml`。
- 英文笔记源文件放 `src/content/notes/en/<slug>.mdx`,**slug 与中文版相同**,中英两篇靠同名配对。中文笔记文件位置不变,URL 不变。
- 配对后 `alternatePath` 字段不再需要手写,由 slug 推导;schema 里的这个字段可以删掉,也可以留作覆盖用,由执行者决定。
- 已有 4 篇英文笔记迁入 `en/` 并改用对应中文篇的 slug:

  | 现英文 slug | 对应中文 slug(迁移后的英文 slug) |
  | --- | --- |
  | `openai-compatible-open-model-api` | `baize-open-model-api` |
  | `third-party-llm-router-security-guide` | `third-party-llm-router-security` |
  | `run-qwen38-mac-unsloth` | `qwen38-mac-unsloth` |
  | `what-is-grok-bot-persistent-ai-teammates` | `grok-bot-persistent-ai-teammates` |

  旧地址 `/notes/<旧 slug>/` 用 `public/_redirects` 做 301 到 `/en/notes/<新 slug>/`(CF Pages 支持该文件;GH 镜像带 noindex,不处理)。这几篇上线不到两个月,改 slug 的 SEO 损失很小。(Claude 的判断,理由是统一配对规则,省掉一张映射表。)
- 中文 `/notes/` 列表、中文 RSS、中文 `llms.txt` 只收中文;英文版只收英文。sitemap 两种都收,并带 hreflang(`@astrojs/sitemap` 的 `i18n` 选项,或自行生成,执行者定)。

### 4.3 hreflang 与语言切换

- 每个有对照页的页面输出 `zh-Hans` / `en` / `x-default` 三条 alternate。`x-default` 指中文版。(Claude 的判断:中文是主站,海外读者靠 `en` 那条命中。)
- 只有中文版、没有英文版的笔记,不输出 alternate。
- 页头的语言切换链接:当前页有对应语言版本时链过去,没有时链到对方语言的首页(笔记页则链到对方语言的笔记列表)。

### 4.4 英文页面文案

- 按海外读者**改写**,不逐句翻译。服务口径仍是 4 项、锚点仍是 `#consulting #training #fde #tools`。
- 交付方式写**远程为主**。FDE 写成 remote-first 的 forward deployed engineering,不承诺上门驻场。(用户确认远程为主;具体措辞是 Claude 的判断。)
- 联系方式:邮箱。WhatsApp 预留位置但这一期不放(没有号码)。不放微信二维码。
- 不放价格。中文站目前也没有价格。
- 页脚英文分支去掉二维码。

### 4.5 联系表单

- `/en/contact/` 复用 `/api/contact`,请求体多带一个 `lang: 'en'`。
- 飞书多维表格加一列「语言」。**部署顺序:先在飞书表里建好这一列,再上线函数改动**,否则写表会因字段不存在而失败(执行者在实施前跟用户确认这一列已建)。
- 函数的报错文案按 `lang` 返回中文或英文;英文表单的前端提示也全是英文。补对应的 vitest 用例。
- 英文页的 origin 和中文相同(都是 `fxai.ai`),`ALLOWED_ORIGIN` 不用改。

### 4.6 英文笔记 frontmatter

- `category` 仍用中文枚举值(显示时由 `categoryLabel(c, 'en')` 转成英文),`relatedService`、`ctaVariant` 与中文版一致。
- `title`、`description`、`coverAlt`、`howto.name`/`steps` 翻成英文。`author` 用 `Baize Tech`。
- `cover` 指向中文版同一张封面文件;正文配图 import `media/<slug>-fig-en.png`(多张时 `-fig-2-en.png` 等,命名沿用中文版并加 `-en`)。
- `pubDate` 用英文版实际发布日;另加一个字段 `sourceHash`,记录翻译时中文源文件的内容哈希(比如 sha256 取前 12 位),供过期检测用。不用 `updatedDate` 做判断:67 篇中文里只有 1 篇写了这个字段,靠人手维护不可靠。(Claude 的判断。)

### 4.7 英文笔记的内链

`<NoteLink slug="x">` 改为按当前语言解析:英文笔记里,`x` 有英文版就链 `/en/notes/x/`;没有时链到中文版,并加一个可见标记(如 "(Chinese)")。不允许链到不存在的英文 URL。`RelatedNotes` 在英文页只推荐英文笔记。

### 4.8 补齐工具

一个脚本(如 `pnpm i18n:status`),输出两张清单:
- **缺失**:有中文、没英文的 slug;
- **过期**:中文源文件当前的哈希和英文 `sourceHash` 对不上的 slug。只改了错字也会被列出来,由人决定要不要重翻。

定期补的流程就是:跑脚本 → 挑一批 → 翻译 + 出图 + QA → 构建抓产物验证 → 提交。

### 4.9 翻译方式

- 由 Claude 翻译(可用 subagent 并行,每批若干篇)。改写的程度:保留论证结构、事实、数字、日期、条款号;把只适用于国内的例子和平台换成海外读者能理解的说法,或者加一句说明。不能编造新事实。
- 国内绑定很紧的篇目(例如 `ai-coding-compute-sourcing`「Sub2API 企业私有 Codex 中转站」、`ai-strategy-first-customer`「明理读播客 04」)照样翻译,但在批次报告里单独列出,请用户看一眼要不要发。
- 质量把关:每批交付时附一份清单(slug、英文标题、配图缩略图、本地化改动点),由用户抽查。

## 5. 分期

1. **基础设施**:§4.1–4.3、4.5、4.7、4.8,加 4 篇存量英文笔记的迁移和 301。完成标准:构建产物里 `/en/` 骨架页面齐全;4 篇迁移后的英文笔记 hreflang 互指正确;旧地址 301;GH 镜像构建无断链;`pnpm check` 和 `pnpm test` 通过。
2. **英文主页面文案**:§4.4 的 7 个页面。
3. **笔记批量翻译**:63 篇 + 约 76 张英文配图,分批推进。
4. **常态**:按 §4.8 定期补。

第 1、2 期可以合并成一次上线;第 3 期每批单独提交。

## 6. 留给执行者的决定

- 英文页面的实现方式:另写 `src/pages/en/*.astro`,或把页面主体抽成组件、用文案对象驱动。约束:新页面样式写在 scoped `<style>` 里,不往 `components.css` 加页面专属样式;避免把中文页的 scoped 样式复制两份后各自漂移。
- 是否启用 Astro 内置 `i18n` 路由配置,还是手写路由 + 一个小的 `lib/i18n.ts`。
- `alternatePath` 字段是删除还是保留为覆盖。
- sitemap hreflang 的实现。
- 第 3 期的批次大小和先后顺序。建议先翻 AEO/GEO、Agent 治理、企业落地这几类,它们和海外 AI 转型咨询最贴近。
- 英文 404 页。
- 存量配图命名不统一(如 `grok-bot-fig-en.png` 没跟 slug 走):迁移时是否顺手改名。
