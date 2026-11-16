import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { convertDir } from './media-webp.mjs';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'media-webp-test-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const png = (name, width, height) =>
  sharp({ create: { width, height, channels: 3, background: '#14E0A0' } }).png().toFile(join(dir, name));

describe('media-webp', () => {
  it('把 PNG 转成同尺寸的 WebP 并删掉 PNG,别的文件不动', async () => {
    await png('one-cover.png', 160, 90);
    await png('one-fig.png', 128, 72);
    writeFileSync(join(dir, 'one-cover.png.r2'), 'sha256 x\nsize 1\n');
    writeFileSync(join(dir, 'photo.jpg'), 'not a png');
    const done = await convertDir(dir);
    expect(done.map((d) => d.name).sort()).toEqual(['one-cover.png', 'one-fig.png']);
    expect(readdirSync(dir).sort()).toEqual(['one-cover.png.r2', 'one-cover.webp', 'one-fig.webp', 'photo.jpg']);
    expect(await sharp(join(dir, 'one-cover.webp')).metadata()).toMatchObject({ format: 'webp', width: 160, height: 90 });
  });

  it('点名时只转点到的', async () => {
    await png('a.png', 16, 16);
    await png('b.png', 16, 16);
    await convertDir(dir, ['b.png']);
    expect(readdirSync(dir).sort()).toEqual(['a.png', 'b.webp']);
  });

  it('重做图:新的 PNG 覆盖同名旧 WebP', async () => {
    await png('a.png', 16, 16);
    await convertDir(dir);
    await png('a.png', 32, 32);
    await convertDir(dir);
    expect(readdirSync(dir)).toEqual(['a.webp']);
    expect(await sharp(join(dir, 'a.webp')).metadata()).toMatchObject({ width: 32, height: 32 });
  });

  it('坏文件报错并保留原文件', async () => {
    writeFileSync(join(dir, 'broken.png'), 'this is not an image');
    await expect(convertDir(dir)).rejects.toThrow();
    expect(readdirSync(dir)).toEqual(['broken.png']);
  });
});
