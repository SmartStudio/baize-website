import { BR, type Rich } from './rich';

type Item = { t: string; d: string; out: string };
/** 锚点是中英共用的终态地址片段,首页和其它页面会深链到这里,所以固定为这 4 个。 */
type Service = { id: 'consulting' | 'training' | 'fde' | 'tools'; n: string; t: string; lead: string; items: Item[] };

export type ServicesCopy = {
  title: string;
  description: string;
  badge: string;
  h1: Rich;
  sub: string;
  jumpLabel: string;
  services: Service[];
  how: { eyebrow: string; h2: string; steps: { k: string; t: string; d: string }[] };
  /** email:有这一项的语言在说明句后接一个邮箱链接(中文页说的是页脚二维码)。 */
  /** 页面上可见的问答,同时生成 FAQPage JSON-LD。只写站内已有依据的事实,价格与客户案例等用户提供后再加。 */
  faq?: { eyebrow: string; h2: string; items: { q: string; a: string }[] };
  book: { h2: Rich; p: string; email?: string; cta: string };
};

export const zh: ServicesCopy = {
  title: '服务｜AI 转型咨询、企业 AI 培训、FDE 驻场开发与工具开发',
  description:
    '白泽明理四项服务：AI 转型咨询排出改造优先级，企业 AI 培训按岗位授课，FDE 工程师驻场把 Agent 接进业务系统，工具开发覆盖中转站、LLM 网关与内部工具。',
  badge: '四项服务 · 咨询 · 培训 · FDE · 工具',
  h1: ['从想清楚，', BR, '到 ', { em: '跑起来' }, '。'],
  sub: '先找出最该改的流程，再教团队用 AI 干活，最后派工程师把 Agent 和工具接进你的系统。四项服务可以单独买，也可以按顺序接。',
  jumpLabel: '服务目录',
  services: [
    {
      id: 'consulting',
      n: '01',
      t: 'AI 转型咨询',
      lead: '访谈各部门，排出改造优先级和验收口径。管理层拿到一份能拍板的清单。',
      items: [
        { t: '现状诊断', d: '访谈管理层、业务和技术团队，记录现在怎么用 AI、卡在哪一步。', out: '诊断报告 + 风险边界' },
        { t: '流程优先级', d: '按收益、风险、改造成本给候选流程排序，选出第一条先改的流程。', out: '改造清单 + 推进节奏' },
        { t: '验收口径', d: '每条流程写清改造前后用什么指标对比、谁来签字。', out: '验收标准 + 复盘模板' },
      ],
    },
    {
      id: 'training',
      n: '02',
      t: '企业 AI 培训',
      lead: '按岗位授课，用学员自己的真实任务练习。课后每个团队留下可复用的 Skill。',
      items: [
        { t: '岗位课程', d: '管理层、业务、研发分开排课，内容对应各自每天的工作。', out: '形式 · 企业内训 / 随工工作坊' },
        { t: 'AI 编程实训', d: '从工具使用推进到真实项目工作流：需求、实现、测试、评审。', out: '形式 · 项目制练习' },
        { t: 'Skills 沉淀', d: '把团队规范、业务经验写成 AI Skills，留在你的组织里。', out: '输出 · Skills / SOP / 上下文' },
      ],
    },
    {
      id: 'fde',
      n: '03',
      t: 'FDE 驻场开发',
      lead: '工程师进你的团队，把 Agent 接进 CRM、ERP、HR。研发流程同步改造。',
      items: [
        { t: 'AI 研发流设计', d: '把 AI 编程纳入需求、实现、测试、评审、文档的日常流程。', out: '研发 SOP + 使用规范 + 验收标准' },
        { t: 'Loop Engineering 设计', d: '让 AI 先自查再交付，每一轮按评估结果修正。', out: '回路架构 + 评估体系 + 可复用模板' },
        { t: '想法到产品端到端交付', d: '从想法到可用产品排出路线图，每一步都能验收。', out: '交付蓝图 + 里程碑 + 验收标准' },
      ],
    },
    {
      id: 'tools',
      n: '04',
      t: '工具开发与产品支持',
      lead: '定制内部工具，上线后持续维护。先从 AI 的统一接入做起。',
      items: [
        { t: 'Codex 中转站搭建', d: '给团队一个稳定、可控、可审计的 Codex 使用入口，不用各自找账号。', out: '接入架构 + 权限规则 + 落地指导' },
        { t: 'LLM API 网关设计', d: '所有 AI 调用走统一入口：鉴权、路由、限流、成本和审计一处管理。', out: '网关蓝图 + 路由降级策略 + 审计设计' },
        { t: '内部工具与维护', d: '按业务需要开发内部工具，上线后跟进问题和迭代。', out: '工具交付 + 运维支持' },
      ],
    },
  ],
  how: {
    eyebrow: '怎么合作',
    h2: '三步，每一步都能停',
    steps: [
      { k: '01', t: '先诊断', d: '30 分钟免费沟通，确认现状和第一条要改的流程。' },
      { k: '02', t: '给方案', d: '交付架构、SOP 和验收标准，管理层据此决定是否推进。' },
      { k: '03', t: '带落地', d: '培训、驻场或工具开发，按里程碑验收，方法沉淀成 Skills。' },
    ],
  },
  book: {
    h2: ['先聊 30 分钟，', BR, '找出第一条该改的流程。'],
    p: '不收费。也可以微信扫页脚二维码直接聊。',
    cta: '预约咨询 →',
  },
};

export const en: ServicesCopy = {
  title: 'Services: AI Consulting, Training & Forward Deployed Engineers',
  description:
    'Four services: AI transformation consulting, AI training for teams, forward deployed engineers, and internal tools. Remote-first, for companies of any size.',
  badge: 'Four services · Consulting · Training · FDE · Tools',
  h1: ['From a clear plan', BR, 'to ', { em: 'production' }, '.'],
  sub: 'We find the workflow most worth changing, train your team to work with AI, and assign engineers who connect agents and tools to your systems. Buy one service, or run all four in order. Delivery is remote-first.',
  jumpLabel: 'Services',
  services: [
    {
      id: 'consulting',
      n: '01',
      t: 'AI transformation consulting',
      lead: 'We interview each department and rank the workflows to change, with acceptance criteria for each. Leadership gets a list it can decide on.',
      items: [
        {
          t: 'Current-state review',
          d: 'Interviews with leadership, business, and engineering teams. We record how each team uses AI today and where it gets stuck.',
          out: 'Review report + risk boundaries',
        },
        {
          t: 'Workflow priorities',
          d: 'Candidate workflows ranked by value, risk, and cost of change. One is picked to go first.',
          out: 'Change list + timeline',
        },
        {
          t: 'Acceptance criteria',
          d: 'For each workflow: which metrics compare before and after, and who signs off.',
          out: 'Acceptance criteria + review template',
        },
      ],
    },
    {
      id: 'training',
      n: '02',
      t: 'Team AI training',
      lead: 'Sessions by role, practiced on each participant’s real tasks. Every team keeps the reusable AI Skills it builds.',
      items: [
        {
          t: 'Role-based courses',
          d: 'Separate tracks for leadership, business teams, and engineers, built around their daily work.',
          out: 'Format · Live online sessions / working sessions',
        },
        {
          t: 'AI coding practice',
          d: 'From tool basics to a real project workflow: requirements, implementation, testing, and review.',
          out: 'Format · Project-based exercises',
        },
        {
          t: 'Skills capture',
          d: 'Team conventions and business know-how written as AI Skills that stay inside your organization.',
          out: 'Output · Skills / SOPs / context',
        },
      ],
    },
    {
      id: 'fde',
      n: '03',
      t: 'Forward deployed engineering',
      lead: 'Remote-first forward deployed engineers join your team and connect agents to your CRM, ERP, and HR systems. Your engineering workflow is updated at the same time.',
      items: [
        {
          t: 'AI development workflow',
          d: 'AI coding built into requirements, implementation, testing, review, and documentation.',
          out: 'Engineering SOPs + usage rules + acceptance criteria',
        },
        {
          t: 'Loop Engineering',
          d: 'AI checks its own work before handing it over, and each round is corrected against evaluation results.',
          out: 'Loop architecture + evaluations + reusable templates',
        },
        {
          t: 'Idea to product',
          d: 'A roadmap from idea to working product, with a check at every step.',
          out: 'Delivery plan + milestones + acceptance criteria',
        },
      ],
    },
    {
      id: 'tools',
      n: '04',
      t: 'Internal tools and product support',
      lead: 'Custom internal tools, maintained after launch. Most teams start with a single, managed way to access AI.',
      items: [
        {
          t: 'Team access to coding agents',
          d: 'One stable, controlled, auditable way for the team to use Codex and similar coding agents, instead of personal accounts.',
          out: 'Access architecture + permission rules + rollout guide',
        },
        {
          t: 'LLM API gateway design',
          d: 'Every AI call goes through one entry point. Authentication, routing, rate limits, cost, and audit are managed there.',
          out: 'Gateway blueprint + routing and fallback rules + audit design',
        },
        {
          t: 'Internal tools and maintenance',
          d: 'Internal tools built for your business, with fixes and iterations after launch.',
          out: 'Tool delivery + ongoing support',
        },
      ],
    },
  ],
  how: {
    eyebrow: 'How we work',
    h2: 'Three steps. You can stop after any of them.',
    steps: [
      { k: '01', t: 'Diagnose', d: 'A free 30-minute call to confirm where you are and the first workflow to change.' },
      { k: '02', t: 'Plan', d: 'We deliver the architecture, SOPs, and acceptance criteria. Leadership decides whether to go ahead.' },
      { k: '03', t: 'Deliver', d: 'Training, embedded engineering, or tool development, accepted milestone by milestone. Methods are captured as Skills.' },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    h2: 'Questions teams ask before the first call',
    items: [
      {
        q: 'What happens in the free 30-minute call?',
        a: 'You tell us how your team works today and the problem you most want solved. We confirm where you are and name the first workflow worth changing. The call is free and does not commit you to anything.',
      },
      {
        q: 'Can we buy just one service?',
        a: 'Yes. Each of the four services can be bought on its own. Teams that want the full path run them in order: consulting, training, forward deployed engineering, then tools.',
      },
      {
        q: 'Do we have to continue after the plan?',
        a: 'No. Work runs in three steps: diagnose, plan, deliver. After the plan, leadership decides whether to go ahead. You can stop after any step.',
      },
      {
        q: 'How does remote delivery work?',
        a: 'Delivery is remote-first. Training runs as live online sessions and working sessions. Forward deployed engineers join your team remotely and connect agents to your systems. Work is accepted milestone by milestone.',
      },
      {
        q: 'Which systems can your engineers connect agents to?',
        a: 'Our forward deployed engineers connect agents to CRM, ERP, and HR systems, and to internal tools. AI calls can go through one LLM API gateway that manages authentication, routing, rate limits, cost, and audit.',
      },
      {
        q: 'What does our team keep after training?',
        a: 'Each team keeps the AI Skills, SOPs, and context it builds during the sessions. They capture your conventions and business know-how and stay inside your organization.',
      },
      {
        q: 'Which languages do you work in?',
        a: 'English and Chinese. You can write to us in either language.',
      },
    ],
  },
  book: {
    h2: ['Start with a 30-minute call.', BR, 'Leave with the first workflow to change.'],
    p: 'Free of charge. You can also email us at',
    email: 'contacts@fxai.ai',
    cta: 'Book a call →',
  },
};
