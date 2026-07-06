// Generates public/og-default.png (1200x630), the default OG/share image and
// Organization logo referenced by Seo.astro / BaseLayout.astro.
//
// Composites the brand mark (public/baize-mark.png) onto a white 1200x630
// canvas alongside the wordmark and tagline, using the same brand tokens as
// src/styles/tokens/colors.css and typography.css.
//
// Usage: node scripts/gen-og-default.mjs
//
// Note: `sharp` is only a transitive dependency here (pulled in by astro's
// own image tooling), so it isn't hoisted to a top-level `node_modules/sharp`
// under pnpm. We resolve it from the pnpm virtual store directly instead of
// adding a new direct dependency just for this one-off asset script.

import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadSharp() {
  try {
    return require('sharp');
  } catch {
    const pnpmDir = path.join(root, 'node_modules', '.pnpm');
    const entries = fs.readdirSync(pnpmDir).filter((d) => d.startsWith('sharp@'));
    if (entries.length === 0) throw new Error('sharp not found in node_modules/.pnpm');
    return require(path.join(pnpmDir, entries[0], 'node_modules', 'sharp'));
  }
}

const sharp = loadSharp();

const WIDTH = 1200;
const HEIGHT = 630;

// Brand tokens (src/styles/tokens/colors.css / typography.css)
const INK_900 = '#111827';
const INK_700 = '#374151';
const GRAY_500 = '#6B7280';
const ORANGE = '#E9961A';
const FONT = 'PingFang SC, Noto Sans SC, Poppins, sans-serif';

async function main() {
  const markPath = path.join(root, 'public', 'baize-mark.png');
  const outPath = path.join(root, 'public', 'og-default.png');

  const markHeight = 360;
  const markMeta = await sharp(markPath).metadata();
  const markWidth = Math.round((markMeta.width / markMeta.height) * markHeight);
  const markBuffer = await sharp(markPath).resize({ height: markHeight }).toBuffer();

  const marginX = 90;
  const markTop = Math.round((HEIGHT - markHeight) / 2);
  const textX = marginX + markWidth + 64;

  const textSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
      <text x="${textX}" y="228" font-family="${FONT}" font-size="21" font-weight="600"
        fill="${GRAY_500}" style="letter-spacing:4px">BAIZE TECH</text>
      <text x="${textX}" y="308" font-family="${FONT}" font-size="76" font-weight="600"
        fill="${INK_900}" style="letter-spacing:-0.02em">白泽明理</text>
      <rect x="${textX}" y="336" width="72" height="6" rx="3" fill="${ORANGE}" />
      <text x="${textX}" y="404" font-family="${FONT}" font-size="33" font-weight="400"
        fill="${INK_700}">让复杂 AI 变得可解释、可验证、可落地。</text>
    </svg>
  `;

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: '#FFFFFF',
    },
  })
    .composite([
      { input: markBuffer, left: marginX, top: markTop },
      { input: Buffer.from(textSvg), left: 0, top: 0 },
    ])
    .png()
    .toFile(outPath);

  console.log('wrote', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
