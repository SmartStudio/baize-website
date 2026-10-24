const site = import.meta.env.SITE as string;

/** 对外主名。副名只进 alternateName，不当标题。 */
export const ORGANIZATION_NAME = '白泽明理';
export const ORGANIZATION_NAME_EN = 'Baize Tech';

/**
 * 全站唯一的 Organization 节点 id。其他 JSON-LD(publisher、provider)用 orgRef 引用它,
 * 不再各自写一份名字:以前英文页的 publisher 写死中文名,同一实体在两种语言里对不上。
 */
export const ORG_ID = new URL('/#organization', site).href;

export const orgRef = (lang: 'zh-CN' | 'en' = 'zh-CN') => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: lang === 'en' ? ORGANIZATION_NAME_EN : ORGANIZATION_NAME,
  url: new URL('/', site).href,
});

const COPY = {
  'zh-CN': {
    name: ORGANIZATION_NAME,
    alternateName: ['Baize Tech', 'Formal eXplainable AI', '白泽明理 Baize Tech'],
    description:
      '白泽明理（Baize Tech）帮企业做 AI 转型，提供 AI 转型咨询、企业 AI 培训、FDE 驻场开发、工具开发与产品支持四项服务。',
    knowsAbout: ['AI 转型咨询', '企业 AI 培训', 'FDE 驻场开发', 'AI Agent 集成', 'LLM API 网关', 'Loop Engineering'],
  },
  en: {
    name: ORGANIZATION_NAME_EN,
    alternateName: [ORGANIZATION_NAME, 'Formal eXplainable AI', '白泽明理 Baize Tech'],
    description:
      'Baize Tech is an AI transformation consultancy. It offers AI transformation consulting, team AI training, forward deployed engineering, and internal tools. Delivery is remote-first.',
    knowsAbout: [
      'AI transformation consulting',
      'AI training for teams',
      'Forward deployed engineering',
      'AI agent integration',
      'LLM API gateways',
      'Loop Engineering',
    ],
  },
} as const;

/**
 * 全站 Organization JSON-LD 的单一事实源。
 * sameAs 只放已经公开、且四元组一致的实体页。LinkedIn / Crunchbase 上线后再追加。
 */
export function organizationJsonLd(lang: 'zh-CN' | 'en' = 'zh-CN') {
  const t = COPY[lang];
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: t.name,
    alternateName: t.alternateName,
    slogan: 'Formal eXplainable AI',
    url: new URL('/', site).href,
    // Google 要求 logo 是方图且不小于 112px;og-default 是 1200×630 的横幅,不合格。
    logo: new URL('/apple-touch-icon.png', site).href,
    email: 'contacts@fxai.ai',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'contacts@fxai.ai',
      availableLanguage: ['zh-CN', 'en'],
    },
    description: t.description,
    knowsAbout: t.knowsAbout,
    areaServed: [
      { '@type': 'City', name: 'Hangzhou' },
      { '@type': 'Country', name: 'CN' },
      'Worldwide',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hangzhou',
      addressCountry: 'CN',
    },
    sameAs: [
      'https://github.com/SmartStudio',
      'https://www.linkedin.com/company/baize-mingli',
      'https://huggingface.co/spaces/zouyanjian/baize-mingli',
      'https://huggingface.co/datasets/zouyanjian/enterprise-ai-sop',
      'https://about.me/yanjianzou',
    ],
  };
}
