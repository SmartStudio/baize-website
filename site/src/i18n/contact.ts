import { BR, type Rich } from './rich';

export type ContactCopy = {
  title: string;
  description: string;
  badge: string;
  h1: Rich;
  sub: string;
  aside: { kicker: string; h2: string; body: string };
  /** 微信二维码只在有这一项的语言里出现。 */
  qr?: { alt: string; caption: string };
};

export const zh: ContactCopy = {
  title: '联系我们',
  description: '预约 AI 落地诊断，或就 AI 转型咨询、企业培训、FDE 驻场开发与工具开发咨询白泽明理。',
  badge: '联系我们 · 杭州 / 远程',
  h1: ['先聊 30 分钟，', BR, '找出第一条', { em: '该改的流程' }, '。'],
  sub: '写下团队现状和最想解决的问题。我们会在 1-2 个工作日内回复，判断 AI 该从哪个流程切入。',
  aside: { kicker: '直接联系', h2: '邮件或微信', body: '附上团队现状和最想解决的问题，我们能更快判断从哪里开始。' },
  qr: { alt: '白泽明理微信二维码', caption: '微信扫码咨询' },
};

export const en: ContactCopy = {
  title: 'Contact Us',
  description:
    'Book a free 30-minute call, or ask Baize Tech about AI transformation consulting, team training, forward deployed engineering, or internal tools.',
  badge: 'Contact · Remote-first',
  h1: ['Talk to us for 30 minutes.', BR, 'Find the first ', { em: 'workflow to change' }, '.'],
  sub: 'Tell us how your team works today and the problem you most want solved. We reply within 1–2 business days with where AI should start.',
  aside: {
    kicker: 'Contact us directly',
    h2: 'Email us',
    body: 'Include how your team works today and the problem you most want solved. It helps us see where to start.',
  },
};
