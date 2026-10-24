import { CATEGORY_INTROS, CATEGORY_INTROS_EN, type CATEGORIES } from '../lib/notes';
import { BR, type Rich } from './rich';

type Category = (typeof CATEGORIES)[number];

export type HomeCopy = {
  title: string;
  description: string;
  /** transcript 按视频里出现的字幕逐条抄,改视频文案时这里要跟着改。 */
  promo: {
    playLabel: string;
    coverAlt: string;
    play: string;
    video: { name: string; description: string; transcript: string[] };
  };
  badge: string;
  h1: Rich;
  sub: string;
  primaryCta: string;
  secondaryCta: string;
  flow: { label: string; kicker: string; before: [string, string]; after: [string, string] };
  services: {
    eyebrow: string;
    h2: string;
    related: string;
    items: { n: string; t: string; d: string; rel: Category[] }[];
  };
  notes: { eyebrow: string; h2: string; more: (n: number) => string };
  topics: { eyebrow: string; h2: string; count: (n: number) => string; intros: Record<Category, string> };
  /** email:有这一项的语言在说明句后接一个邮箱链接(中文页说的是页脚二维码)。 */
  book: { h2: Rich; p: string; email?: string; cta: string };
};

export const zh: HomeCopy = {
  title: '白泽明理｜企业 AI 转型咨询、培训与 FDE 驻场开发',
  description:
    'baize 帮企业找出最该先改的流程，按岗位培训团队用 AI 干活，再派工程师驻场把 Agent 接进 CRM、ERP、HR 系统。明理笔记公开全部方法。',
  promo: {
    playLabel: '播放 baize 介绍视频（1 分钟）',
    coverAlt: 'baize 白泽明理 1 分钟介绍视频封面',
    play: '看 1 分钟了解 baize',
    video: {
      name: '看 1 分钟了解 baize',
      description: 'baize 白泽明理帮企业做 AI Native 转型，提供 AI 转型咨询、企业 AI 培训、FDE 驻场开发、工具开发与产品支持四项服务。',
      transcript: [
        '你的公司，也这样吗？',
        '模型账单失控：五家模型、五套账号、五份账单。',
        '知识散落各处：Wiki、网盘、群聊，找不到也用不上。',
        'AI 试点落不了地：Demo 很惊艳，上线遥遥无期。',
        'baize · 企业 AI Native 转型：咨询、培训、驻场开发、工具，一路陪你到上线。',
        '01 AI 转型咨询：访谈各部门，排出改造优先级和验收口径。',
        '02 企业 AI 培训：按岗位授课，课后每个团队留下可复用的 Skill。',
        '03 FDE 驻场开发：工程师进你的团队，把 Agent 接进 CRM、ERP、HR。',
        'LLM Gateway：一个入口接入所有大模型，成本、权限、用量一目了然。',
        'Agents & Tools Gateway：让 Agent 安全地调用企业的每一个系统和工具。',
        'Company Brain：把散落的文档、数据和经验，变成 AI 随时能用的公司大脑。',
        '04 工具开发与产品支持：按你的业务定制内部工具，上线后持续维护。',
        'Loop Engineering：构建、上线、度量、学习，一轮比一轮好。',
        '让你的公司，按 AI Native 的方式运转。预约 30 分钟免费诊断。fxai.ai',
      ],
    },
  },
  badge: '企业 AI Native 转型 · 咨询 · 培训 · FDE',
  h1: ['让你的公司，', BR, '按 ', { em: 'AI Native' }, ' ', { nw: '的方式运转。' }],
  sub: 'baize 帮企业找出最该先改的流程，教会团队用 AI 干活，再派工程师驻场把 Agent 接进你的系统。',
  primaryCta: '预约 30 分钟免费诊断 →',
  secondaryCta: '先看明理笔记',
  flow: {
    label: '示例：销售报价流程改造前后',
    kicker: '示例流程 · 销售报价',
    before: ['改造前', '翻聊天记录 → 查价目表 → 手写报价 → 等主管审'],
    after: ['改造后', 'Agent 读公司大脑 → 出报价初稿 → 销售确认'],
  },
  services: {
    eyebrow: '我们做什么',
    h2: '从想清楚，到跑起来',
    related: '相关笔记',
    items: [
      { n: '01', t: 'AI 转型咨询', d: '访谈各部门，排出改造优先级和验收口径。', rel: ['企业落地', '案例复盘'] },
      { n: '02', t: '企业 AI 培训', d: '按岗位授课，课后每个团队留下可复用的 Skill。', rel: ['AI普及', 'AI编程'] },
      { n: '03', t: 'FDE 驻场开发', d: '工程师进你的团队，把 Agent 接进 CRM、ERP、HR。', rel: ['Loop与方法论', 'AI编程'] },
      { n: '04', t: '工具开发与产品支持', d: '定制内部工具，上线后持续维护。', rel: ['安全可信', '企业落地'] },
    ],
  },
  notes: { eyebrow: '明理笔记', h2: '方法全公开', more: (n) => `全部 ${n} 篇 →` },
  topics: { eyebrow: '专题', h2: '按问题找答案', count: (n) => `${n} 篇`, intros: CATEGORY_INTROS },
  book: {
    h2: ['先聊 30 分钟，', BR, '找出第一条该改的流程。'],
    p: '不收费。也可以微信扫页脚二维码直接聊。',
    cta: '预约咨询 →',
  },
};

export const en: HomeCopy = {
  title: 'AI Transformation Consulting & Team AI Training | Baize Tech',
  description:
    'AI transformation consulting, role-based AI training for teams, and remote forward deployed engineers who connect AI agents to your CRM, ERP, and HR systems.',
  promo: {
    playLabel: 'Play the baize intro video (1 minute)',
    coverAlt: 'Cover of the 1-minute baize intro video',
    play: 'Watch the 1-minute tour',
    video: {
      name: 'A 1-minute tour of baize',
      description:
        'Baize Tech helps companies run the AI-native way with four services: AI transformation consulting, team AI training, forward deployed engineering, and internal tools and product support.',
      transcript: [
        'Sound familiar?',
        'Runaway AI bills: 5 models, 5 accounts, 5 invoices.',
        'Scattered knowledge: wikis, drives, chats. Never found.',
        'Pilots never ship: great demo, no launch date.',
        'baize · AI-native transformation: consulting, training, engineering and tools, all the way to launch.',
        '01 AI transformation consulting: we interview each department and rank the workflows to change.',
        '02 Team AI training: sessions by role. Each team keeps the reusable AI Skills it builds.',
        '03 Forward deployed engineering: engineers join your team and connect agents to CRM, ERP and HR.',
        'LLM Gateway: one entry point for every model. Cost, access and usage in one view.',
        'Agents & Tools Gateway: agents call every company system and tool, safely.',
        'Company Brain: scattered docs, data and know-how, turned into a brain AI can use.',
        '04 Internal tools and product support: custom tools for your business, maintained after launch.',
        'Loop Engineering: build, ship, measure, learn, better every round.',
        'Run your company the AI-native way. Book a free 30-minute call. fxai.ai',
      ],
    },
  },
  badge: 'AI-native transformation · Consulting · Training · FDE',
  h1: ['Run your company', BR, 'the ', { em: 'AI-native' }, ' ', { nw: 'way.' }],
  sub: 'We find the workflow to change first, train your team to do daily work with AI, and assign engineers who connect agents to your systems. Delivery is remote-first.',
  primaryCta: 'Book a free 30-minute call →',
  secondaryCta: 'Read our notes',
  flow: {
    label: 'Example: a sales quote workflow before and after',
    kicker: 'Example workflow · Sales quotes',
    before: ['Before', 'Search chat history → check the price list → write the quote by hand → wait for manager sign-off'],
    after: ['After', 'Agent reads the company knowledge base → drafts the quote → sales rep confirms'],
  },
  services: {
    eyebrow: 'What we do',
    h2: 'From plan to production',
    related: 'Related notes',
    items: [
      {
        n: '01',
        t: 'AI transformation consulting',
        d: 'We interview each department, rank the workflows to change, and agree on how results will be measured.',
        rel: ['企业落地', '案例复盘'],
      },
      {
        n: '02',
        t: 'Team AI training',
        d: 'Sessions by role, practiced on real tasks. Each team keeps the reusable AI Skills it builds.',
        rel: ['AI普及', 'AI编程'],
      },
      {
        n: '03',
        t: 'Forward deployed engineering',
        d: 'Remote-first engineers join your team and connect agents to your CRM, ERP, and HR systems.',
        rel: ['Loop与方法论', 'AI编程'],
      },
      {
        n: '04',
        t: 'Internal tools and product support',
        d: 'Custom internal tools, maintained after launch.',
        rel: ['安全可信', '企业落地'],
      },
    ],
  },
  notes: { eyebrow: 'Notes', h2: 'Our methods, in public', more: (n) => `All ${n} ${n === 1 ? 'note' : 'notes'} →` },
  topics: { eyebrow: 'Topics', h2: 'Find notes by topic', count: (n) => `${n} ${n === 1 ? 'note' : 'notes'}`, intros: CATEGORY_INTROS_EN },
  book: {
    h2: ['Start with a 30-minute call.', BR, 'Leave with the first workflow to change.'],
    p: 'Free of charge. You can also email us at',
    email: 'contacts@fxai.ai',
    cta: 'Book a call →',
  },
};
