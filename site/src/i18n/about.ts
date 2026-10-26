export type AboutCopy = {
  title: string;
  description: string;
  badge: string;
  h1: string;
  sub: string;
  name: { eyebrow: string; h2: string; items: { k: string; t: string; d: string }[] };
  who: { eyebrow: string; h2: string; paragraphs: string[] };
  origin: { h2: string; p: string };
  values: { eyebrow: string; h2: string; items: { n: string; t: string; d: string }[] };
  book: { h2: string; p: string; cta: string };
};

export const zh: AboutCopy = {
  title: '关于白泽',
  description: '白泽明理是企业 AI Native 转型顾问，和管理层、业务与技术团队一起判断 AI 该进入哪些流程、哪些环节能提效。交付诊断报告、流程改造方案、AI 接入路径、SOP 和验收标准，工作方式包括咨询、培训、FDE 驻场开发和工具开发。',
  badge: '关于白泽明理 · Baize AI',
  h1: '白泽明理',
  sub: '白泽是古代传说里能辨识万物的神兽。明，指透明可解释；理，指数理逻辑与可验证方法。这三个字是我们给自己定的工作要求。',
  name: {
    eyebrow: '品牌释名',
    h2: '一个名字，三条要求',
    items: [
      { k: '白泽', t: '通万物之情', d: '先弄清团队真实在用 AI 做什么、卡在哪，再给方案。' },
      { k: '明', t: '透明可解释', d: '每条建议写清依据和边界，团队自己能看懂、能复核。' },
      { k: '理', t: '可验证方法', d: '先假设、后验证、再交付。结论能被重新推导一遍。' },
    ],
  },
  who: {
    eyebrow: '我们是谁',
    h2: '企业 AI Native 转型顾问',
    paragraphs: [
      '白泽明理服务正在推进 AI 转型的企业。我们和管理层、业务与技术团队一起判断：AI 该进入哪些流程，哪些环节能明显提效，哪些能力要沉淀成团队自己的方法和系统。',
      '交付物包括诊断报告、流程改造方案、AI 接入路径、研发与运营 SOP、验收标准和推进节奏。工作方式有四种：咨询、培训、FDE 驻场开发、工具开发与产品支持。',
      '我们的技术口径有两条：方法要形式化、可验证；过程和结论要让非技术人员也能看懂。',
    ],
  },
  origin: {
    h2: '白泽是什么',
    p: '白泽是中国古代传说中的神兽，能说人话，通晓万物之情。据《云笈七签》引《轩辕本纪》，黄帝巡游到东海边遇见白泽，白泽把天下的鬼神精怪一一讲给他听，黄帝让人画成《白泽图》，告示天下。我们用这个名字，是因为我们做事也是这个顺序：先把企业里 AI 的真实用法和卡点看清、讲明白，再动手改流程。',
  },
  values: {
    eyebrow: '核心价值观',
    h2: '四条工作原则',
    items: [
      { n: '01', t: '解释清楚', d: '每个判断都有可追溯的依据。' },
      { n: '02', t: '严谨落地', d: '先验证再交付，不为速度牺牲可靠性。' },
      { n: '03', t: '安全可信', d: '权限、数据边界和使用规范排在交付速度前面。' },
      { n: '04', t: '长期沉淀', d: '每次交付都留下团队可复用的 Skills 与 SOP。' },
    ],
  },
  book: { h2: '想知道 AI 该从哪个流程切入？', p: '先聊 30 分钟，不收费。', cta: '预约咨询 →' },
};

export const en: AboutCopy = {
  title: 'About Us',
  description:
    'Baize AI advises companies on AI-native transformation: which workflows AI should enter, where it saves time, and how results get verified.',
  badge: 'About Baize AI',
  h1: 'Baize AI',
  sub: 'Baize is a creature from Chinese mythology that could recognize every living thing. Our Chinese name adds two characters: ming, for transparent and explainable, and li, for logic and verifiable method. We use all three as working requirements.',
  name: {
    eyebrow: 'The name',
    h2: 'One name, three requirements',
    items: [
      {
        k: 'Baize',
        t: 'Understand the situation',
        d: 'We find out what your team really uses AI for and where it gets stuck before we propose anything.',
      },
      { k: 'Ming', t: 'Transparent and explainable', d: 'Each recommendation states its basis and its limits, so your team can read and check it.' },
      { k: 'Li', t: 'Verifiable method', d: 'Hypothesis, then verification, then delivery. Every conclusion can be derived again.' },
    ],
  },
  who: {
    eyebrow: 'Who we are',
    h2: 'Advisors for AI-native transformation',
    paragraphs: [
      'Baize AI works with companies that are moving their operations onto AI. With leadership, business, and engineering teams, we decide which workflows AI should enter, where it saves real time, and which capabilities your team should own as its own methods and systems.',
      'Deliverables include a diagnostic report, a workflow change plan, an AI access path, engineering and operations SOPs, acceptance criteria, and a timeline. We work in four ways: consulting, training, forward deployed engineering, and internal tools with product support. Delivery is remote-first.',
      'Our technical standard has two parts. Methods are formal and verifiable. People without a technical background can follow the process and the conclusions.',
    ],
  },
  origin: {
    h2: 'What is Baize?',
    p: 'Baize is a creature from ancient Chinese legend that could speak and knew the nature of all things; the Yellow Emperor had its accounts of every spirit drawn into a guide for the people. We work in the same order: first see and explain how a company really uses AI and where it gets stuck, then change the workflow.',
  },
  values: {
    eyebrow: 'Values',
    h2: 'Four working principles',
    items: [
      { n: '01', t: 'Explain clearly', d: 'Every judgment has a basis you can trace.' },
      { n: '02', t: 'Deliver with rigor', d: 'Verify before delivering. Reliability is not traded for speed.' },
      { n: '03', t: 'Safe and trustworthy', d: 'Permissions, data boundaries, and usage rules come before delivery speed.' },
      { n: '04', t: 'Leave lasting assets', d: 'Every engagement leaves reusable Skills and SOPs with your team.' },
    ],
  },
  book: { h2: 'Not sure which workflow AI should start with?', p: 'Talk to us for 30 minutes. Free of charge.', cta: 'Book a call →' },
};
