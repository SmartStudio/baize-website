import { BR, type Rich } from './rich';

export type MethodCopy = {
  title: string;
  description: string;
  badge: string;
  h1: Rich;
  sub: string;
  stages: {
    eyebrow: string;
    h2: string;
    outLabel: string;
    steps: { n: string; stage: string; title: string; desc: string; out: string }[];
  };
  rules: { eyebrow: string; h2: string; items: { t: string; d: string }[] };
  book: { h2: string; p: string; cta: string; servicesLink: string };
};

export const zh: MethodCopy = {
  title: '白泽方法论：一条 AI 落地路径',
  description: '诊断、接入、工程、交付、沉淀，五步把零散尝鲜变成可验证、可复用的组织 AI 能力。',
  badge: '方法论 · 五步',
  h1: ['先明理，再落地。', BR, { em: '先边界' }, '，再自动化。'],
  sub: '从诊断到沉淀，一共五步。每一步都有明确的产出物，管理层能判断，业务团队能执行，技术团队能复核。',
  stages: {
    eyebrow: '五个阶段',
    h2: '诊断 → 接入 → 工程 → 交付 → 沉淀',
    outLabel: '产出',
    steps: [
      { n: '01', stage: 'Diagnose', title: '诊断', desc: '团队现在怎么用 AI，有哪些真实阻塞。', out: '落地优先级与风险边界' },
      { n: '02', stage: 'Access', title: '接入', desc: '设计工具、网关、中转与安全边界。', out: '接入架构与权限规则' },
      { n: '03', stage: 'Engineer', title: '工程', desc: '设计研发流与迭代回路 Loop。', out: 'SOP、模板与验收标准' },
      { n: '04', stage: 'Deliver', title: '交付', desc: '设计从想法到产品的端到端路径。', out: '交付蓝图与里程碑' },
      { n: '05', stage: 'Compound', title: '沉淀', desc: '形成 Skills、SOP 与知识资产。', out: '团队知识资产' },
    ],
  },
  rules: {
    eyebrow: '三条规矩',
    h2: '每个项目都按这三条执行',
    items: [
      { t: '先边界，再自动化', d: '先写清 AI 能做什么、不能做什么、谁来审查，再谈省多少时间。' },
      { t: '每一步可验收', d: '每个阶段都有产出物和验收口径，没过验收不进下一步。' },
      { t: '方法留在组织里', d: '有效做法写成 Skills 和 SOP，项目结束后团队照样能用。' },
    ],
  },
  book: {
    h2: '从第一步「诊断」开始。',
    p: '30 分钟，不收费。聊完你会拿到第一条该改的流程。',
    cta: '预约诊断 →',
    servicesLink: '查看四项服务',
  },
};

export const en: MethodCopy = {
  title: 'Method: Five Steps to Put AI to Work',
  description:
    'Diagnose, access, engineer, deliver, capture. Five steps that turn scattered AI experiments into capability your organization can verify and reuse.',
  badge: 'Method · Five steps',
  h1: ['Understand first, then build.', BR, { em: 'Boundaries' }, ' before automation.'],
  sub: 'Five steps from diagnosis to capture. Each step has a defined output that leadership can judge, business teams can run, and engineers can check.',
  stages: {
    eyebrow: 'Five stages',
    h2: 'Diagnose → Access → Engineer → Deliver → Capture',
    outLabel: 'Output',
    steps: [
      { n: '01', stage: 'Diagnose', title: 'Diagnosis', desc: 'How your team uses AI today, and what actually blocks it.', out: 'Priorities and risk boundaries' },
      { n: '02', stage: 'Access', title: 'Access', desc: 'Design the tools, gateways, and security boundaries AI runs through.', out: 'Access architecture and permission rules' },
      { n: '03', stage: 'Engineer', title: 'Engineering', desc: 'Design the development workflow and its iteration loop.', out: 'SOPs, templates, and acceptance criteria' },
      { n: '04', stage: 'Deliver', title: 'Delivery', desc: 'Design the end-to-end path from idea to product.', out: 'Delivery plan and milestones' },
      { n: '05', stage: 'Capture', title: 'Capture', desc: 'Turn what works into Skills, SOPs, and knowledge assets.', out: 'Team knowledge assets' },
    ],
  },
  rules: {
    eyebrow: 'Three rules',
    h2: 'Every project follows these three rules',
    items: [
      {
        t: 'Boundaries before automation',
        d: 'First we write down what AI may do, what it may not do, and who reviews its work. Time savings come after that.',
      },
      { t: 'Every step has acceptance criteria', d: 'Each stage has outputs and acceptance criteria. Work does not move on until it passes.' },
      {
        t: 'Methods stay with your team',
        d: 'What works is written into Skills and SOPs, so your team keeps using it after the project ends.',
      },
    ],
  },
  book: {
    h2: 'Start with step one: diagnosis.',
    p: 'A free 30-minute call. You leave with the first workflow to change.',
    cta: 'Book a diagnosis call →',
    servicesLink: 'See the four services',
  },
};
