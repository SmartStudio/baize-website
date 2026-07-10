/**
 * 从 src/assets/baize-mark.png(白泽兽首线稿)生成站点 favicon 与 apple-touch-icon。
 *
 * 为什么不能直接缩放 logo:兽首是细线勾勒,线宽约占图幅 1.4%。缩到 32px 后
 * 线宽只剩 0.3 物理像素,抗锯齿会把它抹成灰雾。所以小尺寸必须主动加粗笔画,
 * 且加粗量要让「最终物理线宽」恒定(约 1.05px),而不是随图标尺寸等比缩放。
 *
 * 同理,橙点按 logo 比例算到 16px 只剩 0.6px 半径会消失,需要给最终像素下限。
 *
 * 注意:sharp 的 erode() 才是「扩张白色前景」(dilate 反而吃掉白色),
 * 且它返回 3 通道,必须 extractChannel(0) 取回单通道才能当 alpha 用。
 *
 * 用法:pnpm run favicon:gen
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src', 'assets', 'baize-mark.png');
const PUBLIC = join(ROOT, 'public');

const NAVY = '#071E5B'; // --bz-logo-navy
const ORANGE = '#E9961A'; // --bz-accent
const MARK_RATIO = 421 / 554; // 源图宽高比
const ORANGE_DOT = { x: 0.485, y: 0.12, r: 0.036 }; // 相对兽首外框,由源图采样得出
const SUPERSAMPLE = 8; // 先在 8 倍尺度合成再缩,抗锯齿质量最好

/**
 * 每档尺寸单独配一套构图(optical sizing):小图不是大图的等比缩小。
 * - 16px:只有 256 个格子,认不出解剖结构,目标是「干净」不是「清晰」——
 *   构图放满榨干像素、笔画少加粗避免糊成团、橙点缩小避免混成棕色。
 * - 32/48px:笔画需加粗才不被抗锯齿抹掉,erode=3 时空隙仍在(=5 起粘连)。
 * - ≥128px:线宽天然够用,不加粗,忠实还原 logo。
 * dot 单位是最终物理像素半径;natural 表示按 logo 原比例。
 */
const specFor = (size) => {
  if (size <= 16) return { markPct: 0.96, erode: 2, dot: 0.85 };
  if (size <= 64) return { markPct: 0.86, erode: 3, dot: 1.15 };
  return { markPct: 0.86, erode: 0, dot: null };
};

async function icon(size, { radiusPct = 0, background = NAVY } = {}) {
  const { markPct, erode, dot: dotPx } = specFor(size);
  const S = size * SUPERSAMPLE;
  const markH = Math.round(S * markPct);
  const markW = Math.round(markH * MARK_RATIO);

  // 取 alpha → 二值化 → erode 加粗 → 当作白色剪影的 alpha
  const fitted = await sharp(SRC).resize(markW, markH, { fit: 'fill' }).png().toBuffer();
  let alpha = sharp(fitted).extractChannel('alpha').threshold(70);
  if (erode > 0) alpha = sharp(await alpha.png().toBuffer()).erode(erode).extractChannel(0);
  const mask = await alpha.png().toBuffer();

  const stroke = await sharp({
    create: { width: markW, height: markH, channels: 3, background: '#ffffff' },
  })
    .joinChannel(mask)
    .png()
    .toBuffer();

  const ox = Math.round((S - markW) / 2);
  const oy = Math.round((S - markH) / 2);
  const cx = ox + ORANGE_DOT.x * markW;
  const cy = oy + ORANGE_DOT.y * markH;
  const dr = dotPx === null ? ORANGE_DOT.r * markW : dotPx * SUPERSAMPLE;
  const dot = Buffer.from(
    `<svg width="${S}" height="${S}"><circle cx="${cx}" cy="${cy}" r="${dr}" fill="${ORANGE}"/></svg>`,
  );

  const r = Math.round(S * radiusPct);
  const plate = Buffer.from(
    `<svg width="${S}" height="${S}"><rect width="${S}" height="${S}" rx="${r}" ry="${r}" fill="${background}"/></svg>`,
  );

  // sharp 的 pipeline 里 resize 先于 composite 执行,必须分两步:先在超采样尺度合成,再缩到目标尺寸
  const composed = await sharp(plate)
    .composite([
      { input: stroke, left: ox, top: oy },
      { input: dot, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return sharp(composed).resize(size, size).png({ compressionLevel: 9, palette: true }).toBuffer();
}

/** 把若干 PNG 打包成 ICO(PNG-in-ICO,现代浏览器与 Windows Vista+ 均支持) */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const icoSizes = [16, 32, 48];
const images = [];
for (const size of icoSizes) images.push({ size, data: await icon(size) });
const ico = packIco(images);
await writeFile(join(PUBLIC, 'favicon.ico'), ico);

// apple-touch-icon:直角实底,iOS 会自行套圆角遮罩;不能带透明
const appleTouch = await icon(180);
await writeFile(join(PUBLIC, 'apple-touch-icon.png'), appleTouch);

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
console.log(`favicon.ico          ${icoSizes.join('/')}px  ${kb(ico.length)}`);
for (const { size, data } of images) console.log(`  └ ${size}px${' '.repeat(14)}${kb(data.length)}`);
console.log(`apple-touch-icon.png 180px      ${kb(appleTouch.length)}`);
