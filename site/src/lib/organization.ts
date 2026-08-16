const site = import.meta.env.SITE as string;

/** 对外主名。副名只进 alternateName，不当标题。 */
export const ORGANIZATION_NAME = '白泽明理';

/**
 * 全站 Organization JSON-LD 的单一事实源。
 * sameAs 只放已经公开、且四元组一致的实体页。LinkedIn / Crunchbase 上线后再追加。
 */
export function organizationJsonLd(overrides: Record<string, unknown> = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORGANIZATION_NAME,
    alternateName: ['Formal eXplainable AI', 'Baize Tech', '白泽明理 Baize Tech'],
    slogan: 'Formal eXplainable AI',
    url: site,
    logo: new URL('/og-default.png', site).href,
    email: 'fxai.labs@gmail.com',
    description:
      '白泽明理（Formal eXplainable AI）是面向企业的 AI 提效与经营流程重塑顾问，帮助企业把 AI 从个人尝鲜做成可验证、可复用的组织能力。',
    knowsAbout: [
      '企业 AI 落地',
      'AI 提效',
      '经营流程重塑',
      '可解释 AI',
      'LLM API 网关设计',
      'AI 研发流程设计',
      'Loop Engineering',
      '端到端交付',
    ],
    areaServed: [
      { '@type': 'City', name: 'Shanghai' },
      { '@type': 'Country', name: 'CN' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Shanghai',
      addressCountry: 'CN',
    },
    sameAs: [
      'https://github.com/SmartStudio',
      'https://www.linkedin.com/company/baize-mingli',
      'https://huggingface.co/spaces/zouyanjian/baize-mingli',
      'https://huggingface.co/datasets/zouyanjian/enterprise-ai-sop',
    ],
    ...overrides,
  };
}
