// pnpm media:webp [文件名...]  (pnpm media:push 上传前会先调它)
// 把 src/content/notes/media/ 里的 PNG 转成 WebP 并删掉 PNG。构建用的源图一律是 WebP:
// 出图工具给的 PNG 每张约 1.3 MB,WebP q95 约 0.1 MB。页面用的是 Astro 从源图再导出的 WebP 和 OG JPEG,
// 源图只是构建输入;每次构建要把全部源图从 R2 拉回来,源图小一个量级,拉取量也小一个量级。
// q95 的画质实测见 docs/media-r2.md。
// 不带参数:转目录里所有 PNG。mdx 里引用的是 .webp(`cover: ./media/<slug>-cover.webp`)。
import { readdirSync, rmSync, statSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const WEBP_OPTIONS = { quality: 95, effort: 6, smartSubsample: true };

// libvips 按路径缓存打开过的文件。重做图时同名 WebP 会被覆盖,不关缓存的话转完读回的是旧文件的尺寸。
sharp.cache(false);

// 转完核对像素尺寸再删 PNG:转坏了宁可留着原图报错。
export async function pngToWebp(file) {
  const out = file.replace(/\.png$/i, '.webp');
  const src = await sharp(file).metadata();
  await sharp(file).webp(WEBP_OPTIONS).toFile(out);
  const dst = await sharp(out).metadata();
  if (dst.width !== src.width || dst.height !== src.height) {
    rmSync(out, { force: true });
    throw new Error(`converted size ${dst.width}x${dst.height} != ${src.width}x${src.height}`);
  }
  const sizes = { from: statSync(file).size, to: statSync(out).size };
  rmSync(file);
  return { out, ...sizes };
}

export async function convertDir(dir, names = []) {
  const todo = (names.length ? names : readdirSync(dir)).filter((n) => /\.png$/i.test(n));
  const done = [];
  const queue = [...todo];
  await Promise.all(Array.from({ length: Math.min(availableParallelism(), queue.length) }, async () => {
    while (queue.length) {
      const name = queue.shift();
      try {
        done.push({ name, ...(await pngToWebp(join(dir, name))) });
      } catch (err) {
        throw new Error(`${name}: ${err.message}`, { cause: err });
      }
    }
  }));
  return done;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = fileURLToPath(new URL('../src/content/notes/media/', import.meta.url));
  const done = await convertDir(dir, process.argv.slice(2));
  const mb = (n) => (n / 1048576).toFixed(1);
  if (done.length) {
    const from = done.reduce((s, d) => s + d.from, 0);
    const to = done.reduce((s, d) => s + d.to, 0);
    console.log(`media: converted ${done.length} PNG to WebP, ${mb(from)} MB -> ${mb(to)} MB`);
  }
}
