export type NotFoundCopy = {
  title: string;
  description: string;
  h1: string;
  sub: string;
  home: string;
  notes: string;
};

export const zh: NotFoundCopy = {
  title: '页面不存在',
  description: '这个链接指向的页面不存在或已经移动。',
  h1: '这里没有页面。',
  sub: '链接可能已经失效，或者地址打错了一个字。',
  home: '回到首页',
  notes: '读明理笔记',
};

export const en: NotFoundCopy = {
  title: 'Page Not Found',
  description: 'The page at this link does not exist or has moved.',
  h1: 'There is no page here.',
  sub: 'The link may be out of date, or the address may have a typo.',
  home: 'Back to home',
  notes: 'Read our notes',
};
