import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import { MIN_LUMINANCE, checkImages, contactSheet, luminance, parseNote, recentNotes } from './note-images.mjs';

const dir = mkdtempSync(join(tmpdir(), 'note-images-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const solid = async (name, background) => {
  const file = join(dir, name);
  await sharp({ create: { width: 64, height: 36, channels: 3, background } }).png().toFile(file);
  return file;
};

describe('parseNote / recentNotes', () => {
  it('读出 pubDate、cover、coverAlt,去掉引号', () => {
    const note = parseNote('a', "---\ntitle: 标题\npubDate: 2026-11-13\ncover: ./media/a-cover.webp\ncoverAlt: '浅薄荷底上一只白色桶'\n---\n\n正文 cover: 不算\n");
    expect(note).toEqual({ slug: 'a', pubDate: '2026-11-13', cover: './media/a-cover.webp', coverAlt: '浅薄荷底上一只白色桶' });
  });

  it('按发布日从新到旧取前 n 篇,同一天按 slug;没有封面的不算', () => {
    const notes = [
      { slug: 'old', pubDate: '2026-10-01', cover: './media/old-cover.webp' },
      { slug: 'b', pubDate: '2026-11-13', cover: './media/b-cover.webp' },
      { slug: 'no-cover', pubDate: '2026-11-14' },
      { slug: 'a', pubDate: '2026-11-13', cover: './media/a-cover.webp' },
    ];
    expect(recentNotes(notes, 2).map((n) => n.slug)).toEqual(['a', 'b']);
  });
});

describe('亮度', () => {
  it('旧的深墨绿底不过线,浅薄荷底和冷白底过线', async () => {
    const dark = await solid('dark.png', '#062A25');
    const mint = await solid('mint.png', '#D6F7EC');
    const white = await solid('white.png', '#F4F6F5');
    expect(await luminance(dark)).toBeLessThan(60);
    const results = await checkImages([dark, mint, white]);
    expect(results.map((r) => r.ok)).toEqual([false, true, true]);
    expect(results[1].luminance).toBeGreaterThanOrEqual(MIN_LUMINANCE);
  });

  it('灰度图(单通道)也能量', async () => {
    const file = join(dir, 'grey.png');
    await sharp({ create: { width: 8, height: 8, channels: 3, background: '#808080' } }).greyscale().png().toFile(file);
    expect(await luminance(file)).toBe(128);
  });
});

describe('contactSheet', () => {
  it('按列数拼成一张图', async () => {
    const files = [await solid('1.png', '#ffffff'), await solid('2.png', '#D6F7EC'), await solid('3.png', '#14E0A0')];
    const out = await contactSheet(files, join(dir, 'sheet.png'), { cols: 2, cell: 160, gap: 4 });
    expect(existsSync(out)).toBe(true);
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([4 + 2 * 164, 4 + 2 * 94]);
  });
});
