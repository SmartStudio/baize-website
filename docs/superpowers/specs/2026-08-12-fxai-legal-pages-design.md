# api.fxai.ai 用户协议 / 隐私协议页面 · 设计文档

## 背景

`api.fxai.ai` 是白泽明理团队的 AI API 网关产品(与站内笔记 `ai-coding-compute-sourcing.mdx` 讨论的"企业自建中转站"是同类形态)。产品需要一份用户协议(Terms of Service)和一份隐私协议(Privacy Policy),中英文各一份,共 4 个页面,托管在本站(`baize-site`,CF 主站 + GH Pages 镜像双部署),供 `api.fxai.ai` 对外链接引用。

面向国际/全球用户,不局限于中国大陆。条款结构参考了 OpenRouter(同类 AI API 网关产品)现行的 Terms of Service 和 Privacy Policy 的章节覆盖面,但砍掉了其中明显只适合大型美国公司的重装条款(强制仲裁 + 集体诉讼豁免 + AAA 仲裁院完整流程),改写为一份适度完整、可由创业期团队自行审阅后发布的标准模板。

## 目标

- 新增 4 个静态页面:中/英文各一份用户协议、隐私协议
- 页面托管在本站,不依赖 `api.fxai.ai` 自己的前端
- 中英文互相可切换,且对搜索引擎正确标注为同一文档的两个语言版本(非重复内容)
- 内容覆盖用户协议/隐私协议的常规必备条款,事实性字段(签约主体、管辖法律、留存期限等)明确标注占位,不编造

## 非目标(本次不做)

- 不做站点级 i18n 框架(不引入 astro-i18next 等库,不改造现有 13 个页面的多语言能力)
- 不做 content collection(4 篇静态法律文档不需要列表页/归档/RSS 这类机制)
- 不做语言的自动检测/客户端切换(用静态链接,不用 JS 判断浏览器语言)
- 不负责最终法律审核——占位字段替换为真实值后,建议用户自行或找律师复核全文

## 技术架构

### 路由与文件

```
src/pages/fxai/terms.mdx         → /fxai/terms/       (用户协议·中文)
src/pages/fxai/terms/en.mdx      → /fxai/terms/en/    (Terms of Service·英文)
src/pages/fxai/privacy.mdx       → /fxai/privacy/     (隐私协议·中文)
src/pages/fxai/privacy/en.mdx    → /fxai/privacy/en/  (Privacy Policy·英文)
```

四个页面都是独立的 MDX 页面路由(Astro 原生的 page route,不进 content collection)。正文用 Markdown 撰写,通过 frontmatter 的 `layout` 字段接入新建的 `LegalLayout.astro`。

`trailingSlash: 'always'` 是现有约定,上述路径均为目录索引形态(`.mdx` 文件名不带 `/en` 后缀歧义,`terms.mdx` 与 `terms/en.mdx` 在文件系统里不冲突,前者是文件、后者所在的 `terms/` 是目录)。

### `LegalLayout.astro`(新建)

不复用 `BaseLayout.astro`。原因:`BaseLayout` 把 `SiteHeader`(中文导航 + 咨询 CTA)和 `SiteFooter`(微信二维码 + "预约 AI 落地诊断"按钮)硬编码在结构里,这些是白泽明理咨询业务的营销元素,与 `api.fxai.ai` 的法律文档无关;若靠 CSS 隐藏,DOM 里这些无关链接依然会被搜索引擎和读屏软件读到。`LegalLayout` 直接组装 `<html>` + `Seo` + `JsonLd`,复用这两个组件的通用逻辑(canonical、noindex、Organization schema),但外壳自己定义:

- **顶部**:白泽 logo(链接回官网首页 `/`)+ 右上角语言切换链接(中文页显示「EN」链接到 `/en/` 版本,英文页显示「中文」链接回去)
- **正文区**:限定阅读宽度(约 70ch)的长文排版,复用站点已有的 `bz-` 排版 CSS 变量(字体/间距/颜色 token),不引入笔记页的封面图、目录、"继续读"结构
- **底部**:一行版权声明(`© {year} 白泽明理 Baize Tech`),不放二维码和咨询 CTA

Props:`title`、`description`、`path`、`lang`(`'zh-CN' | 'en'`)、`docTitle`(页面内大标题)、`altPath`(另一语言版本的路径,用于切换链接和 hreflang)、`effectiveDate`。

### `Seo.astro` 扩展(向后兼容)

新增三个可选 prop,默认值保持现有行为不变,现有 13 个页面调用方式不用改:

- `lang`(默认 `'zh-CN'`):决定 `<html lang>` 属性和 `og:locale`(`en` → `en_US`)
- `alternates`(默认空):渲染 `<link rel="alternate" hreflang="...">`,中英文互指对方 URL,并加一条 `hreflang="x-default"` 指向中文版
- `titleSuffix`(默认 `'· 白泽明理'`):英文页传 `'· Baize Tech'`

### JSON-LD

沿用 `JsonLd.astro` 现有的 Organization schema(通过 `BaseLayout`/新 `LegalLayout` 统一注入),不额外定义 `WebPage`/`Article` 等类型——法律文档没有必要装饰化的结构化数据,过度添加属于无意义的 SEO 装饰。

## 内容结构

### 用户协议(Terms of Service)· 14 节

1. 服务说明 —— `api.fxai.ai` 是什么(AI API 网关/代理服务),可访问的模型/上游服务商由 fxai 选择且可能变化
2. 账号与资格 —— 注册要求、最低年龄限制、账号安全责任(API Key 保密义务)
3. 使用规则(禁止行为)—— 精简自 OpenRouter 的 12 条:不得用于非法用途、不得转售/滥用访问权、不得抓取站点数据、不得规避限流与安全措施、不得侵犯第三方权利
4. 计费与付款 —— 占位:具体计费模式(预付额度/按量后付费)待定,以产品内定价页为准
5. 服务可用性与变更 —— 不保证不中断,模型/功能可能调整或下线
6. 用户内容 —— 用户输入内容归属;上游模型服务商可能对内容有独立的训练政策,建议用户查看具体模型条款
7. 知识产权 —— 平台自身代码/界面/品牌的权利归属
8. 免责声明 —— 服务"按现状"提供,不作特定用途适用性等担保
9. 责任限制 —— 责任上限的标准表述
10. 赔偿 —— 精简版(用户对自身违规使用导致的第三方索赔负责)
11. 终止 —— 用户和平台各自的终止权利
12. 适用法律与争议解决 —— **占位**:管辖法律和争议解决方式待签约主体确定后填写
13. 协议变更通知方式
14. 联系方式

### 隐私协议(Privacy Policy)· 12 节

1. 我们收集哪些信息 —— 账号信息、API 调用日志与请求内容(是否留存、留存原因)、支付信息、自动收集的技术信息(IP/浏览器/Cookie)
2. 我们如何使用信息
3. 我们如何共享信息 —— 上游模型服务商、支付/托管服务商、法定情形下的披露
4. 数据存储与跨境传输 —— **占位**:服务器所在地区待定
5. 数据留存期限 —— **占位**:具体天数/规则待工程侧确认真实做法
6. 用户的权利与选择 —— 访问/更正/删除请求的申请方式
7. 数据安全 —— 标准安全措施表述
8. 儿童隐私 —— 最低年龄限制
9. Cookie 说明
10. 第三方链接 —— 平台不对第三方网站的隐私实践负责
11. 政策变更通知方式
12. 联系我们

### 占位字段清单(上线前必须由用户确认,不由 Claude 编造)

| 字段 | 当前状态 |
| --- | --- |
| 签约主体全称 + 注册地 | 只有品牌名"白泽明理",公司主体/注册地待补 |
| 适用法律 / 管辖法院或仲裁机构 | 依赖上一项,待补 |
| 生效日期 | 待补(建议:文档定稿并替换完所有占位后再填当天日期) |
| 计费模式具体规则 | 预付/后付未定,先用通用表述占位 |
| API 请求内容留存时长与方式 | 需要工程侧真实做法,不是法律偏好 |
| 数据存储服务器所在地区 | 待补 |
| 法律事务联系邮箱 | 默认沿用 `fxai.labs@gmail.com`,如需专用地址(如 `legal@fxai.ai`)请告知 |

这些字段会在正文中用清晰可搜索的占位标记(例如 `[ENTITY_NAME]`、`[GOVERNING_LAW — 待确认]`)呈现,而不是写成看似确定的默认值——避免占位符不小心变成悄悄上线的假承诺。

## 验证方式

- `pnpm build` 后检查 `dist/fxai/{terms,privacy}/index.html` 与 `dist/fxai/{terms,privacy}/en/index.html` 是否都生成
- 检查每个页面的 `<html lang>`、`og:locale`、`<link rel="alternate" hreflang>` 是否正确互指
- 检查 `dist/sitemap-0.xml` 是否自动收录这 4 个新路径(`@astrojs/sitemap` 应自动扫描,无需手动配置)
- 用浏览器实际打开 4 个页面,确认极简外壳(无中文导航、无咨询 CTA、无二维码)、语言切换链接工作正常
- 确认占位字段在正文中清晰可见、未被误当成正式内容呈现
