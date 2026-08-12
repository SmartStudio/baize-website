# api.fxai.ai 用户协议 / 隐私协议页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在本站新增 4 个静态页面(中/英文各一份用户协议、隐私协议),供 `api.fxai.ai` 产品对外链接引用。

**Architecture:** 新建极简的 `LegalLayout.astro`(不复用带营销导航的 `BaseLayout`/`SiteHeader`/`SiteFooter`),扩展 `Seo.astro` 支持 `lang`/`alternates`/`titleSuffix` 三个向后兼容的可选 prop,4 篇正文以独立 MDX page route 的形式接入该布局。

**Tech Stack:** Astro 7(`@astrojs/mdx` page route,非 content collection)、站内既有 `bz-` CSS design token。

## Global Constraints

- 路由终态(`trailingSlash: 'always'`):`/fxai/terms/`、`/fxai/terms/en/`、`/fxai/privacy/`、`/fxai/privacy/en/`。
- 任何邮箱文本/链接必须用 `<!--email_off-->...<!--/email_off-->` 包裹(CLAUDE.md 强制约定,防止 CF Email Obfuscation 注入解码脚本)。
- 联系邮箱统一使用 `fxai.labs@gmail.com`(设计文档已确认,不是待定占位)。
- `Seo.astro` 的改动必须向后兼容:新增 prop 均为可选且有默认值,不改变现有 13 个页面在不传新 prop 时的渲染输出。
- 4 个正文页面为独立 MDX page route(`src/pages/fxai/...`),不进 content collection。
- 法律事实类占位字段统一格式:中文页 `[FIELD_NAME — 待确认]`,英文页 `[FIELD_NAME — TBD]`,内容需按设计文档列出的字段填,不得编造具体数值(实体名称、适用法律、计费模式、日志留存策略、数据存储地区、留存期限)。
- 页面外壳为极简版:仅 logo(链接回站点首页)+ 语言切换链接 + 版权行,不出现 `SiteHeader`/`SiteFooter` 的中文导航和咨询 CTA。

---

## Task 1: 扩展 `Seo.astro` 支持多语言

**Files:**
- Modify: `site/src/components/Seo.astro`

**Interfaces:**
- Produces:`Seo.astro` 新增 3 个可选 prop —— `lang?: 'zh-CN' | 'en'`(默认 `'zh-CN'`)、`titleSuffix?: string`(默认 `'· 白泽明理'`)、`alternates?: { hreflang: string; path: string }[]`(默认 `[]`)。后续任务的 `LegalLayout.astro` 会传入这三个 prop。

- [ ] **Step 1: 修改 `Seo.astro` 的 Props 接口和默认值**

把文件顶部(第 14-39 行)的这段:

```astro
interface Props {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  article?: { published: string; modified?: string; section?: string; author?: string };
  noindex?: boolean;
}
const {
  title,
  description,
  path,
  ogImage = '/og-default.png',
  ogImageAlt,
  ogType = 'website',
  article,
  noindex: forceNoindex = false,
} = Astro.props;
const site = import.meta.env.SITE;
const canonical = new URL(path, site).href;
const ogUrl = new URL(ogImage, site).href;
// GH 镜像整站 noindex(去重指向 CF 主站);404 页则无论在哪个 target 都不该被收录
const noindex = forceNoindex || import.meta.env.PUBLIC_DEPLOY_TARGET === 'ghpages';
const fullTitle = path === '/' ? title : `${title} · 白泽明理`;
```

替换为:

```astro
interface Props {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  article?: { published: string; modified?: string; section?: string; author?: string };
  noindex?: boolean;
  lang?: 'zh-CN' | 'en';
  titleSuffix?: string;
  alternates?: { hreflang: string; path: string }[];
}
const {
  title,
  description,
  path,
  ogImage = '/og-default.png',
  ogImageAlt,
  ogType = 'website',
  article,
  noindex: forceNoindex = false,
  lang = 'zh-CN',
  titleSuffix = '· 白泽明理',
  alternates = [],
} = Astro.props;
const site = import.meta.env.SITE;
const canonical = new URL(path, site).href;
const ogUrl = new URL(ogImage, site).href;
// GH 镜像整站 noindex(去重指向 CF 主站);404 页则无论在哪个 target 都不该被收录
const noindex = forceNoindex || import.meta.env.PUBLIC_DEPLOY_TARGET === 'ghpages';
const fullTitle = path === '/' ? title : `${title} ${titleSuffix}`;
const locale = lang === 'en' ? 'en_US' : 'zh_CN';
```

- [ ] **Step 2: 让 `og:locale` 用新算出的 `locale`,并渲染 `alternates`**

把:

```astro
<meta property="og:locale" content="zh_CN" />
```

替换为:

```astro
<meta property="og:locale" content={locale} />
```

在 `<link rel="canonical" href={canonical} />` 这一行之后、`{noindex && ...}` 这一行之前,插入:

```astro
{alternates.map((a) => (
  <link rel="alternate" hreflang={a.hreflang} href={new URL(a.path, site).href} />
))}
```

- [ ] **Step 3: 构建并核对现有页面无回归**

```bash
cd site && pnpm build
grep -o '<meta property="og:locale"[^>]*>' dist/about/index.html
grep -o '<title>[^<]*</title>' dist/about/index.html
```

Expected:第一条输出 `<meta property="og:locale" content="zh_CN">`,第二条输出的标题以 `· 白泽明理` 结尾 —— 和改动前完全一致,说明新增的可选 prop 没有影响现有页面。

- [ ] **Step 4: Commit**

```bash
git add site/src/components/Seo.astro
git commit -m "feat(seo): Seo.astro 支持多语言(lang/titleSuffix/alternates)"
```

---

## Task 2: 新建 `LegalLayout.astro` + 用户协议中文版

**Files:**
- Create: `site/src/layouts/LegalLayout.astro`
- Create: `site/src/pages/fxai/terms.mdx`

**Interfaces:**
- Consumes:`Seo.astro` 的 `lang`/`titleSuffix`/`alternates` prop(Task 1 产出)。
- Produces:`LegalLayout.astro` 的 Props —— `title: string`、`description: string`、`path: string`、`lang: 'zh-CN' | 'en'`、`docTitle: string`、`altPath: string`、`effectiveDate: string`。后续 3 个正文页面都通过 MDX frontmatter 的 `layout` 字段 + 这些字段名接入。

- [ ] **Step 1: 创建 `LegalLayout.astro`**

```astro
---
import { Image } from 'astro:assets';
import mark from '../assets/baize-mark.png';
import Seo from '../components/Seo.astro';
import JsonLd from '../components/JsonLd.astro';

const GA_MEASUREMENT_ID = 'G-MWFL1P6ZVP';

interface Props {
  title: string;
  description: string;
  path: string;
  lang: 'zh-CN' | 'en';
  docTitle: string;
  altPath: string;
  effectiveDate: string;
}

const { title, description, path, lang, docTitle, altPath, effectiveDate } = Astro.props;

const isZh = lang === 'zh-CN';
const titleSuffix = isZh ? '· 白泽明理' : '· Baize Tech';
const altLabel = isZh ? 'EN' : '中文';
const selfHreflang = isZh ? 'zh-Hans' : 'en';
const altHreflang = isZh ? 'en' : 'zh-Hans';
const alternates = [
  { hreflang: selfHreflang, path },
  { hreflang: altHreflang, path: altPath },
  { hreflang: 'x-default', path: isZh ? path : altPath },
];

// base 恒以 / 结尾(CF 主站是 '/',GH 镜像是 '/baize-website/');
// altPath 是不含 base 前缀的站点绝对路径(供 Seo 拼 canonical/hreflang 用),
// 这里再拼一份跳转链接实际可点的相对地址。
const base = import.meta.env.BASE_URL;
const altHref = `${base}${altPath.replace(/^\//, '')}`;

const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '白泽明理 Baize Tech',
  alternateName: 'Baize Tech',
  slogan: 'Formal eXplainable AI',
  url: import.meta.env.SITE,
  logo: new URL('/og-default.png', import.meta.env.SITE).href,
  email: 'fxai.labs@gmail.com',
};
---
<!doctype html>
<html lang={lang}>
  <head>
    {import.meta.env.PROD && (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}></script>
        <script define:vars={{ GA_MEASUREMENT_ID }}>
          window.dataLayer = window.dataLayer || [];
          function gtag() { dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', GA_MEASUREMENT_ID);
        </script>
      </>
    )}
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href={`${base}favicon.ico`} sizes="32x32" />
    <link rel="apple-touch-icon" href={`${base}apple-touch-icon.png`} />
    <Seo
      title={title}
      description={description}
      path={path}
      lang={lang}
      titleSuffix={titleSuffix}
      alternates={alternates}
    />
    <JsonLd schema={org} />
  </head>
  <body>
    <header class="bz-legal-topbar">
      <a class="bz-legal-topbar__brand" href={base}>
        <Image class="bz-legal-topbar__logo" src={mark} alt="白泽明理" width={56} loading="eager" />
        <span class="bz-legal-topbar__wm bz-logotype">白泽明理</span>
      </a>
      <a class="bz-legal-topbar__switch" href={altHref}>{altLabel}</a>
    </header>
    <main class="bz-legal">
      <div class="bz-shell bz-legal__inner">
        <h1 class="bz-legal__title">{docTitle}</h1>
        <p class="bz-legal__date bz-eyebrow">{isZh ? '生效日期' : 'Effective date'}: {effectiveDate}</p>
        <div class="bz-legal__body">
          <slot />
        </div>
      </div>
    </main>
    <footer class="bz-legal-footer">
      <p>© {new Date().getFullYear()} 白泽明理 Baize Tech</p>
    </footer>
  </body>
</html>

<style>
  .bz-legal-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--bz-space-24) var(--bz-page-gutter);
    border-bottom: var(--bz-border);
  }

  .bz-legal-topbar__brand {
    display: inline-flex;
    align-items: center;
    gap: var(--bz-space-12);
    color: var(--bz-text-primary);
    text-decoration: none;
  }

  .bz-legal-topbar__logo {
    width: 28px;
    height: auto;
  }

  .bz-legal-topbar__wm {
    font-size: 17px;
    color: var(--bz-text-primary);
  }

  .bz-legal-topbar__switch {
    color: var(--bz-text-secondary);
    font-family: var(--bz-font-mono);
    font-size: var(--bz-type-small-size);
    letter-spacing: 0.04em;
    text-decoration: none;
    border: var(--bz-border);
    padding: 6px 14px;
  }

  .bz-legal-topbar__switch:hover {
    color: var(--bz-text-primary);
    border-color: var(--bz-border-strong);
  }

  .bz-legal {
    padding: clamp(48px, 7vw, 88px) 0;
  }

  .bz-legal__inner {
    max-width: var(--bz-read-max);
  }

  .bz-legal__title {
    margin: 0;
    color: var(--bz-text-primary);
    font-family: var(--bz-font-display);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    line-height: 1.25;
  }

  .bz-legal__date {
    margin: var(--bz-space-16) 0 0;
  }

  .bz-legal__body {
    margin-top: clamp(32px, 4vw, 48px);
  }

  .bz-legal__body :global(p) {
    margin: 0 0 20px;
    color: var(--bz-text-secondary);
    font-size: 16px;
    line-height: 1.85;
  }

  .bz-legal__body :global(h2) {
    margin: 40px 0 14px;
    color: var(--bz-text-primary);
    font-family: var(--bz-font-display);
    font-size: 22px;
    font-weight: 650;
    line-height: 1.35;
  }

  .bz-legal__body :global(ul),
  .bz-legal__body :global(ol) {
    margin: 0 0 20px;
    padding-left: 22px;
    color: var(--bz-text-secondary);
    font-size: 16px;
    line-height: 1.85;
  }

  .bz-legal__body :global(li) {
    margin-bottom: 8px;
  }

  .bz-legal__body :global(a) {
    color: var(--bz-accent-strong);
  }

  .bz-legal__body :global(code) {
    font-family: var(--bz-font-mono);
    font-size: 0.9em;
    background: var(--bz-paper-100);
    padding: 2px 6px;
  }

  .bz-legal-footer {
    border-top: var(--bz-border);
    padding: var(--bz-space-24) var(--bz-page-gutter);
    text-align: center;
  }

  .bz-legal-footer p {
    margin: 0;
    color: var(--bz-text-muted);
    font-size: var(--bz-type-caption-size);
  }
</style>
```

- [ ] **Step 2: 创建用户协议中文正文 `site/src/pages/fxai/terms.mdx`**

```mdx
---
layout: ../../layouts/LegalLayout.astro
title: 用户协议
description: api.fxai.ai 用户协议——服务说明、账号规则、使用规范、计费、知识产权、责任限制与争议解决方式。
path: /fxai/terms/
lang: zh-CN
docTitle: api.fxai.ai 用户协议
altPath: /fxai/terms/en/
effectiveDate: '[EFFECTIVE_DATE — 待确认]'
---

api.fxai.ai(以下简称"本服务")由 [ENTITY_NAME — 待确认]("我们"、"白泽明理")运营。当你注册、访问或使用本服务时，即表示你同意本用户协议（以下简称"本协议"）的全部条款。如果你不同意本协议的任何内容，请不要使用本服务。

## 1. 服务说明

本服务是一个 AI API 网关/代理服务，帮助开发者和企业通过统一的接口调用一个或多个第三方大语言模型服务商（"上游模型服务商"）提供的能力。我们会根据上游服务商的可用性、合规要求和产品规划，随时新增、调整或下线可接入的模型，不另行单独通知每一次调整。

本服务本身不训练或运营底层模型，仅负责请求路由、账号与额度管理、日志与安全防护。你的请求最终会被转发给你选定或系统自动路由到的上游模型服务商处理。

## 2. 账号与资格

- 你需要年满 18 周岁，或已获得监护人同意，才能注册和使用本服务。
- 你在注册时提供的信息（包括但不限于邮箱、企业信息）应真实、准确，并在发生变化时及时更新。
- 你对自己账号下的所有活动负责，包括通过你的 API Key 发起的所有调用。请妥善保管账号密码和 API Key，一旦怀疑泄露或存在未授权使用，应立即通知我们并自行更换密钥。
- 若你代表企业或组织注册和使用本服务，你需确保自己已获得代表该组织签署本协议的授权。

## 3. 使用规则

使用本服务时，你不得：

1. 违反任何适用法律法规，或违反上游模型服务商各自的使用条款；
2. 将本服务用于生成、传播违法、侵权、欺诈或危害他人的内容；
3. 转售 API 访问权限，或未经授权将本服务包装为竞争性产品对外提供；
4. 使用自动化工具抓取、复制本服务的站点内容或系统数据；
5. 尝试规避我们设置的限流、配额或安全防护机制；
6. 冒用他人身份、虚构关联关系，或未经授权访问他人账号；
7. 上传、传输任何侵犯第三方知识产权、隐私权或其他合法权益的内容；
8. 传播恶意代码，或以任何方式干扰、破坏本服务的正常运行。

违反上述规则可能导致你的账号被立即暂停或终止，且已产生费用不予退还。

## 4. 计费与付款

本服务的计费方式（预付额度、按量计费或订阅制）、价格、免费额度及退款规则以产品内定价页面的实时公示为准。`[BILLING_MODEL — 待确认：预付额度制 / 按量后付费制 / 其他]`

我们可能根据成本和市场情况调整费用，重大调价会提前通知已注册用户；你可以在调价生效前停止使用本服务以避免产生新费用。

## 5. 服务可用性与变更

本服务按"现状"提供，我们不保证服务不会中断、不出错，也不保证任何特定上游模型会持续可用。我们可能因维护、上游服务商政策变化或产品规划调整，随时增加、修改或下线功能与模型接入，并尽合理努力提前告知重大变更。

## 6. 用户内容

你通过本服务发送的请求内容（"输入"）和收到的返回内容（"输出"）的权利归属，按你所选用上游模型服务商各自的条款处理；不同模型服务商对输入/输出的训练使用政策不同，我们建议你在正式使用前查阅所选模型的具体条款。

`[LOGGING_POLICY — 待确认：本服务是否记录/留存请求内容，用于何种目的，留存多久，请按工程侧真实实现填写]`

你保证自己发送的输入内容为你原创或已获得必要授权，且不违反任何法律或侵犯第三方权利。我们有权在发现内容违反本协议时，暂停对相关请求的处理。

## 7. 知识产权

本服务的界面、代码、文档、品牌标识等由我们或我们的许可方拥有，受知识产权法律保护。本协议未明确授予你的一切权利，均由我们保留。

## 8. 免责声明

本服务按"现状"和"现有"基础提供，在法律允许的最大范围内，我们不对适销性、特定用途适用性、服务不中断或无错误作任何明示或默示的保证。你应自行评估模型输出是否适用于你的具体场景，特别是涉及医疗、法律、金融等高风险用途时，需要人工审核后再使用。

## 9. 责任限制

在法律允许的最大范围内，我们对因使用或无法使用本服务而产生的任何间接、附带、特殊或后果性损失不承担责任；我们的累计责任上限为你在造成该损失前 12 个月内向本服务支付的费用总额。

## 10. 赔偿

如因你违反本协议或适用法律，导致我们遭受第三方索赔或损失，你同意就该等索赔进行合理范围内的赔偿。

## 11. 终止

你可以随时通过 <!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off--> 联系我们终止账号；终止前已产生的费用仍需结清。我们也可能在你违反本协议时暂停或终止你的账号；因你违约导致的终止，未使用额度不予退还。因我们自身原因终止服务的，未使用额度将按合理方式处理。

## 12. 适用法律与争议解决

`[GOVERNING_LAW — 待确认：适用法律及争议解决方式，需在签约主体和注册地确定后填写]`

## 13. 协议变更

我们可能不时更新本协议。涉及你重大权利义务的变更，我们会提前通过邮件或产品内通知的方式告知，并给出合理的过渡期；你在变更生效后继续使用本服务，即视为接受修改后的协议。建议你定期查看本页面。

## 14. 联系方式

如对本协议有任何疑问，请联系：<!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off-->
```

- [ ] **Step 3: 构建并核对该页面产物**

```bash
cd site && pnpm build
grep -o '<html lang="[^"]*"' dist/fxai/terms/index.html
grep -o '<meta property="og:locale"[^>]*>' dist/fxai/terms/index.html
grep -o '<link rel="canonical"[^>]*>' dist/fxai/terms/index.html
grep -o '<link rel="alternate"[^>]*>' dist/fxai/terms/index.html
```

Expected:
- `<html lang="zh-CN"`
- `<meta property="og:locale" content="zh_CN">`
- `<link rel="canonical" href="https://baize.example.com/fxai/terms/">`
- 三条 `<link rel="alternate">`:`hreflang="zh-Hans"` 指回自己、`hreflang="en"` 指向 `/fxai/terms/en/`、`hreflang="x-default"` 指向 `/fxai/terms/`(英文版此时还不存在,这一步只核对链接文本本身正确,404 会在 Task 3 完成后消失)

- [ ] **Step 4: Commit**

```bash
git add site/src/layouts/LegalLayout.astro site/src/pages/fxai/terms.mdx
git commit -m "feat(fxai): 新建 LegalLayout 与用户协议中文版"
```

---

## Task 3: 用户协议英文版

**Files:**
- Create: `site/src/pages/fxai/terms/en.mdx`

**Interfaces:**
- Consumes:`LegalLayout.astro` 的 Props(Task 2 产出),`layout` 相对路径因目录深了一层,要写 `../../../layouts/LegalLayout.astro`。

- [ ] **Step 1: 创建 `site/src/pages/fxai/terms/en.mdx`**

```mdx
---
layout: ../../../layouts/LegalLayout.astro
title: Terms of Service
description: Terms of Service for api.fxai.ai — service description, account rules, acceptable use, billing, intellectual property, liability limits, and dispute resolution.
path: /fxai/terms/en/
lang: en
docTitle: api.fxai.ai Terms of Service
altPath: /fxai/terms/
effectiveDate: '[EFFECTIVE_DATE — TBD]'
---

api.fxai.ai (the "Service") is operated by [ENTITY_NAME — TBD] ("we", "us", "Baize Tech"). By registering for, accessing, or using the Service, you agree to these Terms of Service (these "Terms"). If you do not agree, please do not use the Service.

## 1. Description of Service

The Service is an AI API gateway that lets developers and businesses call one or more third-party large language model providers ("Upstream Model Providers") through a unified interface. We may add, adjust, or remove available models at any time based on upstream availability, compliance requirements, or product roadmap, without notifying you of every individual change.

We do not train or operate the underlying models ourselves; we handle request routing, account and quota management, logging, and abuse protection. Your requests are ultimately forwarded to the Upstream Model Provider you select, or that our system routes to automatically.

## 2. Eligibility and Accounts

- You must be at least 18 years old, or have parental/guardian consent, to register for and use the Service.
- Information you provide at registration (including but not limited to your email and company information) must be accurate and kept up to date.
- You are responsible for all activity under your account, including any calls made with your API keys. Keep your password and API keys confidential, and notify us immediately and rotate your keys if you suspect any unauthorized use.
- If you register on behalf of a company or organization, you confirm that you are authorized to bind that organization to these Terms.

## 3. Acceptable Use

You agree not to:

1. Violate any applicable law or regulation, or the terms of any Upstream Model Provider;
2. Use the Service to generate, distribute, or facilitate unlawful, infringing, fraudulent, or harmful content;
3. Resell API access, or repackage the Service as a competing product without authorization;
4. Use automated tools to scrape or copy site content or system data from the Service;
5. Attempt to circumvent rate limits, quotas, or security controls we put in place;
6. Impersonate any person or entity, misrepresent an affiliation, or access another user's account without authorization;
7. Upload or transmit content that infringes any third party's intellectual property, privacy, or other legal rights;
8. Distribute malicious code or otherwise interfere with or disrupt the Service.

Violating these rules may result in immediate suspension or termination of your account, and any fees already incurred will not be refunded.

## 4. Billing and Payment

Pricing, billing model (prepaid credits, usage-based billing, or subscription), free-tier limits, and refund rules are governed by the live pricing page within the product. `[BILLING_MODEL — TBD: prepaid credits / postpaid usage-based / other]`

We may adjust pricing based on cost and market conditions. We will provide advance notice of material price changes to registered users, and you may stop using the Service before a change takes effect to avoid new charges.

## 5. Availability and Changes to the Service

The Service is provided "as is." We do not guarantee uninterrupted or error-free operation, and we do not guarantee that any specific model will remain available. We may add, modify, or remove features and model access at any time for maintenance, upstream policy changes, or product reasons, and we will make reasonable efforts to give advance notice of material changes.

## 6. Your Content

Ownership of the content you send to the Service ("Input") and the content you receive back ("Output") is governed by the terms of the Upstream Model Provider you use; training-use policies for Input/Output vary by provider, so we recommend reviewing the specific model's terms before relying on them.

`[LOGGING_POLICY — TBD: whether and how the Service logs/retains request content, for what purpose, and for how long — fill in based on actual engineering implementation]`

You represent that any Input you submit is your own or that you have the necessary rights to submit it, and that it does not violate any law or infringe any third party's rights. We may suspend processing of requests that we determine violate these Terms.

## 7. Intellectual Property

The Service's interface, code, documentation, and branding are owned by us or our licensors and are protected by intellectual property laws. All rights not expressly granted to you under these Terms are reserved by us.

## 8. Disclaimer

The Service is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and uninterrupted or error-free operation. You are responsible for evaluating whether model output is suitable for your use case, especially for high-stakes uses such as medical, legal, or financial applications, which require human review before use.

## 9. Limitation of Liability

To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the Service. Our aggregate liability is capped at the total fees you paid for the Service in the 12 months preceding the event giving rise to the claim.

## 10. Indemnification

You agree to indemnify us, within a reasonable scope, against third-party claims or losses arising from your breach of these Terms or applicable law.

## 11. Termination

You may terminate your account at any time by contacting <!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off-->; charges incurred before termination remain payable. We may suspend or terminate your account if you breach these Terms; unused credits are non-refundable in that case. If we terminate the Service for reasons on our part, unused credits will be handled in a reasonable manner.

## 12. Governing Law and Dispute Resolution

`[GOVERNING_LAW — TBD: governing law and dispute-resolution mechanism, to be filled in once the contracting entity and jurisdiction of incorporation are confirmed]`

## 13. Changes to These Terms

We may update these Terms from time to time. For changes that materially affect your rights or obligations, we will provide advance notice by email or an in-product notice, with a reasonable transition period. Continued use of the Service after a change takes effect constitutes acceptance of the revised Terms. We recommend checking this page periodically.

## 14. Contact

If you have questions about these Terms, please contact: <!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off-->
```

- [ ] **Step 2: 构建并核对中英文互指**

```bash
cd site && pnpm build
grep -o '<html lang="[^"]*"' dist/fxai/terms/en/index.html
grep -o '<meta property="og:locale"[^>]*>' dist/fxai/terms/en/index.html
grep -o '<link rel="alternate"[^>]*>' dist/fxai/terms/en/index.html
grep -o '<link rel="alternate"[^>]*>' dist/fxai/terms/index.html
```

Expected:
- 英文页:`<html lang="en"`,`og:locale` 为 `en_US`,`hreflang="zh-Hans"` 指向 `https://baize.example.com/fxai/terms/`,`hreflang="x-default"` 也指向中文版
- 中文页(回归核对):三条 `alternate` 链接和 Task 2 的核对结果一致,`hreflang="en"` 现在指向的英文版页面已经真实存在

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/fxai/terms/en.mdx
git commit -m "feat(fxai): 新增用户协议英文版"
```

---

## Task 4: 隐私协议中文版

**Files:**
- Create: `site/src/pages/fxai/privacy.mdx`

**Interfaces:**
- Consumes:`LegalLayout.astro` 的 Props(Task 2 产出)。

- [ ] **Step 1: 创建 `site/src/pages/fxai/privacy.mdx`**

```mdx
---
layout: ../../layouts/LegalLayout.astro
title: 隐私协议
description: api.fxai.ai 隐私协议——我们收集哪些信息、如何使用与共享、数据留存、你的权利与联系方式。
path: /fxai/privacy/
lang: zh-CN
docTitle: api.fxai.ai 隐私协议
altPath: /fxai/privacy/en/
effectiveDate: '[EFFECTIVE_DATE — 待确认]'
---

本隐私政策说明 api.fxai.ai(以下简称"本服务")由 [ENTITY_NAME — 待确认]("我们")在你使用本服务过程中，如何收集、使用、共享和保护你的个人信息。使用本服务即表示你同意本隐私政策所述的处理方式。

## 1. 我们收集哪些信息

- **账号信息**：注册邮箱、密码（加密存储）、企业名称（如适用）等你主动提供的信息。
- **API 调用相关信息**：API Key、调用时间、调用的模型、请求与响应的元数据（如 token 用量）。`[REQUEST_CONTENT_LOGGING — 待确认：是否记录/留存请求正文内容（prompt）与返回内容，若记录用于何种目的、留存多久]`
- **支付信息**：账单地址、交易记录；实际支付卡信息由第三方支付处理商处理，我们不存储完整卡号。
- **自动收集的技术信息**：IP 地址、浏览器类型、操作系统、访问时间、Cookie 及类似技术收集的使用数据。

## 2. 我们如何使用这些信息

我们将收集的信息用于：提供并维护本服务（包括把你的请求转发给相应的上游模型服务商）；账号管理与通知；计费与账单核对；安全防护与欺诈识别；遵守法律义务；在获得你同意的情况下发送产品更新或营销信息。

## 3. 我们如何共享信息

- **上游模型服务商**：为处理你的请求，我们会将请求内容转发给你选定或系统路由到的上游模型服务商；该服务商可能依据其自身政策使用这些内容（例如用于模型训练），建议查阅具体服务商的条款。
- **服务提供商**：支付处理、云托管等履行合同义务所必需的第三方服务商，仅在必要范围内获得数据访问权限。
- **法律要求**：在收到有效法律程序（如法院令、传票）或为遵守法律义务时，我们可能披露必要信息。
- 除上述情形外，我们不会出售你的个人信息。

## 4. 数据存储与跨境传输

`[DATA_RESIDENCY — 待确认：服务器/数据存储所在地区，以及是否存在跨境传输，如涉及请补充跨境传输的合规依据]`

## 5. 数据留存期限

我们仅在实现本政策所述目的所必需的期限内保留个人信息，此后会删除或做匿名化处理，法律要求更长留存期限的除外。`[RETENTION_PERIOD — 待确认：账号信息、请求日志等各类数据的具体留存天数]`

## 6. 你的权利与选择

你可以通过 <!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off--> 向我们申请访问、更正或删除你的个人信息，或要求我们提供你数据的副本。我们会在收到申请后的合理时间内响应。你也可以随时联系我们退订营销邮件。

## 7. 数据安全

我们采取合理的技术和管理措施（如传输加密、访问权限控制）保护你的个人信息，但请注意，互联网传输无法做到绝对安全，我们无法保证数据在传输过程中的绝对安全。

## 8. 儿童隐私

本服务不面向 18 周岁以下（或适用法律规定的更高年龄）的未成年人。如果我们发现在未获得监护人同意的情况下收集了未成年人的个人信息，将尽快删除相关数据。

## 9. Cookie 说明

我们使用 Cookie 及类似技术维持登录状态、记住偏好设置并分析产品使用情况。你可以通过浏览器设置管理或拒绝 Cookie，但这可能影响部分功能的正常使用。

## 10. 第三方链接

本服务可能包含指向第三方网站或服务的链接。我们对这些第三方的隐私实践不承担责任，建议你在访问前查阅其各自的隐私政策。

## 11. 本政策的变更

我们可能不时更新本隐私政策。重大变更会通过邮件或产品内通知告知你；建议定期查看本页面以了解最新内容。

## 12. 联系我们

如对本隐私政策有任何疑问或希望行使你的数据权利，请联系：<!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off-->
```

- [ ] **Step 2: 构建并核对该页面产物**

```bash
cd site && pnpm build
grep -o '<html lang="[^"]*"' dist/fxai/privacy/index.html
grep -o '<link rel="canonical"[^>]*>' dist/fxai/privacy/index.html
```

Expected:`<html lang="zh-CN"`,canonical 为 `https://baize.example.com/fxai/privacy/`。

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/fxai/privacy.mdx
git commit -m "feat(fxai): 新增隐私协议中文版"
```

---

## Task 5: 隐私协议英文版 + 全站集成验证

**Files:**
- Create: `site/src/pages/fxai/privacy/en.mdx`

**Interfaces:**
- Consumes:`LegalLayout.astro` 的 Props(Task 2 产出)。

- [ ] **Step 1: 创建 `site/src/pages/fxai/privacy/en.mdx`**

```mdx
---
layout: ../../../layouts/LegalLayout.astro
title: Privacy Policy
description: Privacy Policy for api.fxai.ai — what information we collect, how we use and share it, data retention, your rights, and how to contact us.
path: /fxai/privacy/en/
lang: en
docTitle: api.fxai.ai Privacy Policy
altPath: /fxai/privacy/
effectiveDate: '[EFFECTIVE_DATE — TBD]'
---

This Privacy Policy explains how [ENTITY_NAME — TBD] ("we", "us") collects, uses, shares, and protects your personal data when you use api.fxai.ai (the "Service"). By using the Service, you agree to the practices described in this Privacy Policy.

## 1. Information We Collect

- **Account information**: your registration email, password (stored encrypted), company name (if applicable), and other information you provide directly.
- **API usage information**: API keys, request timestamps, models called, and request/response metadata (such as token usage). `[REQUEST_CONTENT_LOGGING — TBD: whether we log/retain request content (prompts) and responses, and if so, for what purpose and how long]`
- **Payment information**: billing address and transaction records; actual card details are handled by our third-party payment processor, and we do not store full card numbers.
- **Automatically collected technical information**: IP address, browser type, operating system, access times, and usage data collected via cookies and similar technologies.

## 2. How We Use This Information

We use the information we collect to: provide and maintain the Service (including forwarding your requests to the relevant Upstream Model Provider); manage your account and send service notices; process billing; protect against fraud and abuse; comply with legal obligations; and, where you have consented, send product updates or marketing communications.

## 3. How We Share Information

- **Upstream Model Providers**: to process your requests, we forward request content to the Upstream Model Provider you select or that our system routes to; that provider may use the content under its own policies (for example, for model training) — please review the specific provider's terms.
- **Service providers**: third parties such as payment processors and cloud hosting providers that we rely on to operate the Service, who receive access only to the extent necessary.
- **Legal requirements**: we may disclose information when required by valid legal process (such as a court order or subpoena) or to comply with legal obligations.
- Other than as described above, we do not sell your personal data.

## 4. Data Storage and International Transfers

`[DATA_RESIDENCY — TBD: the region(s) where servers/data are stored, and whether any international transfers occur; if so, add the applicable transfer safeguard]`

## 5. Data Retention

We retain personal data only for as long as necessary to fulfill the purposes described in this policy, after which we delete or anonymize it, unless a longer retention period is required by law. `[RETENTION_PERIOD — TBD: specific retention periods for account data, request logs, and other data categories]`

## 6. Your Rights and Choices

You may request access to, correction of, or deletion of your personal data, or request a copy of your data, by contacting <!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off-->. We will respond within a reasonable time. You may also unsubscribe from marketing emails at any time.

## 7. Data Security

We use reasonable technical and organizational measures (such as encryption in transit and access controls) to protect your personal data. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.

## 8. Children's Privacy

The Service is not directed to individuals under 18 (or the higher age of majority under applicable law). If we learn that we have collected personal data from a minor without parental consent, we will delete it as soon as reasonably possible.

## 9. Cookies

We use cookies and similar technologies to keep you signed in, remember your preferences, and analyze how the Service is used. You can manage or disable cookies through your browser settings, though doing so may affect some functionality.

## 10. Third-Party Links

The Service may contain links to third-party websites or services. We are not responsible for their privacy practices, and we recommend reviewing their privacy policies before providing any information.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by email or an in-product notice; we recommend checking this page periodically for the latest version.

## 12. Contact Us

If you have questions about this Privacy Policy or wish to exercise your data rights, please contact: <!--email_off--><a href="mailto:fxai.labs@gmail.com">fxai.labs@gmail.com</a><!--/email_off-->
```

- [ ] **Step 2: 构建**

```bash
cd site && pnpm build
```

- [ ] **Step 3: 全站集成验证 —— 4 个页面 + sitemap**

```bash
for p in fxai/terms fxai/terms/en fxai/privacy fxai/privacy/en; do
  echo "=== $p ==="
  test -f "dist/$p/index.html" && echo "存在" || echo "缺失!"
done

grep -o 'https://baize.example.com/fxai/[a-z/]*' dist/sitemap-0.xml | sort -u
```

Expected:4 个页面全部存在;sitemap 里出现 4 条对应 URL(`@astrojs/sitemap` 扫描构建产物自动生成,不需要手动配置)。

- [ ] **Step 4: 用浏览器实际打开 4 个页面确认外壳与切换**

```bash
cd site && npx astro dev
```

打开 `http://localhost:4321/fxai/terms/`、`/fxai/terms/en/`、`/fxai/privacy/`、`/fxai/privacy/en/`,确认:
- 页面外壳只有 logo + 语言切换链接 + 版权行,没有中文导航栏和咨询 CTA
- 点击右上角语言切换链接能正确跳到对应语言版本
- 正文里的方括号占位字段清晰可见,没有被误渲染成别的内容
- 邮箱链接可点击,查看页面源码确认 `<!--email_off-->` 注释确实包在 `<a href="mailto:...">` 外层

确认完毕后:

```bash
npx astro dev stop
```

- [ ] **Step 5: Commit**

```bash
git add site/src/pages/fxai/privacy/en.mdx
git commit -m "feat(fxai): 新增隐私协议英文版"
```

---

## Self-Review Notes(写计划时已自查)

- **Spec 覆盖**:设计文档的路由结构、LegalLayout 极简外壳、Seo.astro 三个新 prop、14+12 节内容结构、7 个占位字段(联系邮箱已确认不算占位)——每一项都能对应到具体 Task。
- **占位符扫描**:计划里所有 Step 都是可直接执行的完整代码/命令,没有 "TBD 由工程师自己想"式的空话;文档正文里出现的 `[FIELD — 待确认]` 是这个功能故意设计的可见占位符,不是计划本身的缺口。
- **类型/字段一致性**:`LegalLayout` 的 5 个 Props(`title`/`description`/`path`/`lang`/`docTitle`/`altPath`/`effectiveDate`)与 4 篇 MDX frontmatter 字段名逐一对应;`Seo.astro` 新增的 `lang`/`titleSuffix`/`alternates` 在 Task 1 定义、Task 2 的 `LegalLayout` 中被消费,命名前后一致。
