/**
 * 从 src/assets/baize-logo-square.png(2026-10 新白泽兽首,实心剪影,透明底)生成
 * favicon、apple-touch-icon、PWA manifest 图标和 Organization 结构化数据用的方形 logo。
 *
 * 新 logo 是实心色块,不像旧线稿那样需要给小尺寸加粗笔画;只按尺寸调整兽首占比
 * (optical sizing):16px 放满榨干像素,大图留出呼吸空间。
 *
 * 图标统一为「白色兽首 + 白泽绿底」,和旧版「白线 + 藏青底」同一思路,
 * 浏览器深色/浅色标签栏都能认出来。
 *
 * 用法:pnpm run favicon:gen
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src', 'assets', 'baize-logo-square.png');
const PUBLIC = join(ROOT, 'public');

const GREEN = '#024B3B'; // 新 logo 原色,取自源图主色
const SUPERSAMPLE = 8;

/** 兽首(含源图 6% 留白的方形母版)占图标边长的比例 */
const markPctFor = (size) => (size <= 16 ? 1.08 : size <= 48 ? 1.0 : 0.86);

async function plateIcon(size, { background = GREEN, color = '#ffffff' } = {}) {
  const S = size * SUPERSAMPLE;
  const markS = Math.round(S * markPctFor(size));
  // 母版四周有 6% 透明留白;占比 >1 时放大后裁回中心 S×S,只裁掉留白
  let resized = sharp(await sharp(SRC).resize(markS, markS).png().toBuffer());
  const crop = Math.max(0, Math.floor((markS - S) / 2));
  const side = Math.min(markS, S);
  if (crop > 0) resized = resized.extract({ left: crop, top: crop, width: side, height: side });
  const alpha = await resized.extractChannel('alpha').png().toBuffer();
  const mark = await sharp({ create: { width: side, height: side, channels: 3, background: color } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
  const off = Math.round((S - side) / 2);
  const composed = await sharp({ create: { width: S, height: S, channels: 4, background } })
    .composite([{ input: mark, left: off, top: off }])
    .png()
    .toBuffer();
  return sharp(composed).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

/** 把若干 PNG 打包成 ICO(PNG-in-ICO,现代浏览器与 Windows Vista+ 均支持) */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const out = async (name, buf) => {
  await writeFile(join(PUBLIC, name), buf);
  console.log(`${name.padEnd(26)} ${kb(buf.length)}`);
};

const icoSizes = [16, 32, 48];
const images = [];
for (const size of icoSizes) images.push({ size, data: await plateIcon(size) });
await out('favicon.ico', packIco(images));
await out('favicon-16x16.png', images[0].data);
await out('favicon-32x32.png', images[1].data);
// apple-touch-icon:直角实底,iOS 会自行套圆角遮罩;不能带透明
await out('apple-touch-icon.png', await plateIcon(180));
await out('icon-192.png', await plateIcon(192));
await out('icon-512.png', await plateIcon(512));

// Organization JSON-LD 的 logo:Google 要方图 ≥112px,这里给 1024 绿兽首 + 白底。
await mkdir(join(PUBLIC, 'brand'), { recursive: true });
const orgLogo = await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff' } })
  .composite([{ input: await sharp(SRC).resize(1024, 1024).png().toBuffer(), left: 0, top: 0 }])
  .flatten({ background: '#ffffff' })
  .png({ compressionLevel: 9 })
  .toBuffer();
await out('brand/baize-logo.png', orgLogo);
