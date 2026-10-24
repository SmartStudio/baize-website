import { describe, it, expect } from 'vitest';
import { visibleCjk, hrefTarget } from './check-i18n-dist.mjs';

describe('visibleCjk', () => {
  it('忽略 script 里的 JSON-LD', () => {
    expect(visibleCjk('<p>Hello</p><script type="application/ld+json">{"name":"白泽明理"}</script>')).toEqual([]);
  });
  it('抓出页头中文字标', () => {
    expect(visibleCjk('<span class="hd__cn">白泽明理</span>')).toEqual(['白泽明理']);
  });
  it('忽略 style 与 HTML 注释', () => {
    expect(visibleCjk('<style>.a::after{content:"中"}</style><!-- 注释 --><p>ok</p>')).toEqual([]);
  });
  it('只豁免标了中文 lang 的语言切换链接', () => {
    expect(visibleCjk('<a class="hd__lang" href="/notes/" hreflang="zh-Hans" lang="zh-CN">中文</a>')).toEqual([]);
    expect(visibleCjk('<a href="/notes/x/">中文标题</a>')).toEqual(['中文标题']);
  });
});

describe('hrefTarget', () => {
  it('目录地址落到 index.html,/404 落到 404.html', () => {
    expect(hrefTarget('/en/notes/', '/')).toBe('en/notes/index.html');
    expect(hrefTarget('/baize-website/en/notes/x/#top', '/baize-website/')).toBe('en/notes/x/index.html');
    expect(hrefTarget('/en/404', '/')).toBe('en/404.html');
    expect(hrefTarget('/en/rss.xml', '/')).toBe('en/rss.xml');
  });
  it('不带 base 前缀的站内绝对路径返回 null', () => {
    expect(hrefTarget('/en/notes/', '/baize-website/')).toBeNull();
  });
});
