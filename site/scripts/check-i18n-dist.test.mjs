import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import * as path from 'node:path';
import { visibleCjk, hrefTarget, imgsMissingAlt, sitePath, checkDist } from './check-i18n-dist.mjs';

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

describe('imgsMissingAlt', () => {
  it('没有 alt、alt 为空、Astro 输出的裸 alt 都算缺', () => {
    expect(imgsMissingAlt('<img src="a.webp">')).toHaveLength(1);
    expect(imgsMissingAlt('<img src="a.webp" alt="">')).toHaveLength(1);
    expect(imgsMissingAlt('<img src="a.webp" alt sizes="100vw" loading="lazy">')).toHaveLength(1);
    expect(imgsMissingAlt('<img src="a.webp" alt="  ">')).toHaveLength(1);
  });
  it('有描述的 alt 不报,data-alt 之类不算 alt', () => {
    expect(imgsMissingAlt('<img src="a.webp" alt="白泽明理微信二维码" loading="lazy">')).toEqual([]);
    expect(imgsMissingAlt('<img data-alt="x" src="a.webp">')).toHaveLength(1);
  });
});

describe('imgsMissingAlt 边界', () => {
  it('alt 里带 > 不误报,title 里的 alt= 不算,实体空格算空,注释里的图不算', () => {
    expect(imgsMissingAlt('<img src="x" alt="Requests > available workers">')).toEqual([]);
    expect(imgsMissingAlt(`<img src="x" title="example alt='description' here">`)).toHaveLength(1);
    expect(imgsMissingAlt('<img src="x" alt="&#32;&nbsp;">')).toHaveLength(1);
    expect(imgsMissingAlt('<!-- <img src="x"> -->')).toEqual([]);
  });
});

describe('sitePath', () => {
  it('根相对与同源绝对地址算站内,外站不算', () => {
    expect(sitePath('/en/notes/x/#a', 'https://fxai.ai')).toBe('/en/notes/x/');
    expect(sitePath('https://fxai.ai/en/notes/x/', 'https://fxai.ai')).toBe('/en/notes/x/');
    expect(sitePath('https://example.com/en/', 'https://fxai.ai')).toBeNull();
    expect(sitePath('//cdn.example.com/a', 'https://fxai.ai')).toBeNull();
    expect(sitePath('https://FXAI.ai:443/en/notes/x/', 'https://fxai.ai')).toBe('/en/notes/x/');
  });
});

describe('checkDist: 中文页的 /en/ 链接与 sitemap', () => {
  const page = (body) => `<!doctype html><html lang="zh-CN"><body>${body}</body></html>`;
  const make = (files) => {
    const dir = mkdtempSync(join(tmpdir(), 'i18n-dist-'));
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), text);
    }
    return dir;
  };
  const msgs = (dist, base) => checkDist(dist, base, { notesEnDir: '/nonexistent' }).map((e) => e.msg);

  it('base / 下:中文页指向不存在的英文笔记(相对或同源绝对)要报', () => {
    const dist = make({
      'notes/a/index.html': page('<a href="/en/notes/a/">EN</a><a href="https://fxai.ai/en/notes/b/">b</a><a href="/en/notes/">ok</a><a title="a > b" href="/en/notes/c/">c</a>'),
      'en/notes/index.html': '<html lang="en"><body>ok</body></html>',
      'sitemap-0.xml': '<urlset><url><loc>https://fxai.ai/notes/a/</loc></url><url><loc>https://fxai.ai/en/notes/zz/</loc></url></urlset>',
    });
    const m = msgs(dist, '/');
    expect(m).toContain('链接目标不存在: /en/notes/a/');
    expect(m).toContain('链接目标不存在: https://fxai.ai/en/notes/b/');
    expect(m).toContain('链接目标不存在: /en/notes/c/');
    expect(m).toContain('sitemap 地址没有页面: https://fxai.ai/en/notes/zz/');
    expect(m.some((x) => x.includes('/en/notes/"') || x.endsWith(': /en/notes/'))).toBe(false);
  });

  it('子路径 base 下:sitemap 缺 base 时映射到 GH dist', () => {
    const dist = make({
      'notes/a/index.html': page('<a href="/en/notes/a/">EN</a><a href="/baize-website/en/notes/">ok</a>'),
      'notes/ok/index.html': page('ok'),
      'en/notes/index.html': '<html lang="en"><body>ok</body></html>',
      'sitemap-0.xml': '<urlset><url><loc>https://fxai.ai/en/notes/zz/</loc></url></urlset>',
    });
    const m = msgs(dist, '/baize-website/');
    expect(m).toContain('站内链接缺 base 前缀 /baize-website/: /en/notes/a/');
    expect(m).toContain('sitemap 地址没有页面: https://fxai.ai/en/notes/zz/');
    expect(m.filter((x) => x.includes('/baize-website/en/notes/'))).toEqual([]);
  });
});
import { canonicalSitemapUrl, canonicalSitemapIndex } from '../src/lib/sitemap-urls.mjs';

describe('GH 镜像 sitemap 正式地址', () => {
  const site = 'https://fxai.ai';
  const base = '/baize-website/';
  const d = fs.mkdtempSync(path.join(tmpdir(), 'gh-sitemap-'));
  const msgs = (dist, base) => checkDist(dist, base, { notesEnDir: '/nonexistent' }).map((e) => e.msg);
  it.each([
    ['https://fxai.ai/baize-website/notes/phishing-email-ai-misblock/', 'https://fxai.ai/notes/phishing-email-ai-misblock/'],
    ['https://fxai.ai/baize-website/en/notes/factory-power-anomaly-ai-alert/', 'https://fxai.ai/en/notes/factory-power-anomaly-ai-alert/'],
    ['https://fxai.ai/baize-website/', 'https://fxai.ai/'],
    ['https://fxai.ai/baize-website', 'https://fxai.ai/'],
    ['https://fxai.ai/notes/official-document-ai-draft/', 'https://fxai.ai/notes/official-document-ai-draft/'],
    ['https://others.example/baize-website/notes/official-document-ai-draft/', 'https://others.example/baize-website/notes/official-document-ai-draft/'],
    ['https://fxai.ai/baize-website-more/x/', 'https://fxai.ai/baize-website-more/x/'],
  ])('去掉实际 base 前缀：%s', (input, expected) => {
    expect(canonicalSitemapUrl(input, site, base)).toBe(expected);
  });

  it('保留根路径和查询，CF defaults 不变', () => {
    const input = 'https://fxai.ai/notes/social-comment-ai-reply/?ref=mirror';
    expect(canonicalSitemapUrl(input, site, '/')).toBe(input);
  });

  it('校验器把正式 URL 映射回 GH dist，并拒绝镜像 base URL', () => {
    const d = mkdtempSync(join(tmpdir(), 'gh-sitemap-'));
    fs.mkdirSync(join(d, 'en', 'notes', 'ok'), { recursive: true });
    fs.mkdirSync(join(d, 'notes', 'ok'), { recursive: true });
    fs.mkdirSync(join(d, 'en', 'notes'), { recursive: true });
    for (const f of []) {
      fs.writeFileSync(join(d, f), '<html lang="en"><head><link rel="alternate" hreflang="zh-Hans" href="https://fxai.ai/" /><link rel="alternate" hreflang="en" href="https://fxai.ai/en/notes/ok/" /></head><body></body></html>');
    }
    for (const [f, zh, en] of [['index.html','/','/en/notes/'],['en/notes/index.html','/','/en/notes/'],['notes/ok/index.html','/notes/ok/','/en/notes/ok/'],['en/notes/ok/index.html','/notes/ok/','/en/notes/ok/']]) {
      fs.writeFileSync(join(d,f),`<html><head><link rel="alternate" hreflang="zh-Hans" href="https://fxai.ai${zh}"/><link rel="alternate" hreflang="en" href="https://fxai.ai${en}"/></head></html>`);
    }
    fs.writeFileSync(join(d, 'sitemap-index.xml'), '<loc>https://fxai.ai/sitemap-0.xml</loc><lastmod>2026-11-06T00:00:00.000Z</lastmod>');
    fs.writeFileSync(join(d, 'sitemap-0.xml'), '<urlset><url><loc>https://fxai.ai/en/notes/ok/</loc><xhtml:link rel="alternate" hreflang="en" href="https://fxai.ai/en/notes/ok/"/><xhtml:link rel="alternate" hreflang="zh-Hans" href="https://fxai.ai/notes/ok/"/><xhtml:link rel="alternate" hreflang="x-default" href="https://fxai.ai/notes/ok/"/></url></urlset>');
    expect(msgs(d, '/baize-website/')).toEqual([]);
    fs.writeFileSync(join(d, 'sitemap-0.xml'), '<urlset><url><loc>https://fxai.ai/baize-website/notes/phishing-email-ai-misblock/</loc></url></urlset>');
    expect(msgs(d, '/baize-website/')).toContain('sitemap 地址含镜像 base: https://fxai.ai/baize-website/notes/phishing-email-ai-misblock/');
  });

  it('镜像索引拒绝 baize-website 而 CF 索引保留最后日期', () => {
    const d = mkdtempSync(join(tmpdir(), 'gh-index-'));
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(join(d, 'sitemap-index.xml'), '<loc>https://fxai.ai/baize-website/sitemap-0.xml</loc><lastmod>2026-11-06T00:00:00.000Z</lastmod>');
    expect(msgs(d, '/baize-website/')).toContain('sitemap 索引地址不是正式域: https://fxai.ai/baize-website/sitemap-0.xml');
    fs.writeFileSync(join(d, 'sitemap-index.xml'), '<loc>https://fxai.ai/sitemap-0.xml</loc><lastmod>2026-11-06T00:00:00.000Z</lastmod>');
    expect(msgs(d, '/')).toEqual([]);
  });

  it('镜像索引保留原 lastmod，只规范 loc', () => {
    const old = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://fxai.ai/baize-website/sitemap-0.xml</loc><lastmod>2026-11-06T00:00:00.000Z</lastmod></sitemap></sitemapindex>';
    const fixed = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://fxai.ai/sitemap-0.xml</loc><lastmod>2026-11-06T00:00:00.000Z</lastmod></sitemap></sitemapindex>';
    expect(canonicalSitemapIndex(old, site, base)).toBe(fixed);
  });
});
