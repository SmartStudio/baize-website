// pnpm notes:covers [n] [--out <png>]  最近 n 篇(默认 8)笔记的封面拼成一张联络表,并列出亮度和 coverAlt。
//                                       写新封面的画面之前看一眼:构图类型和视角别和最近三篇相同。
// pnpm notes:image-check <图...>        量每张图的平均亮度(0-255)。低于 210 以 1 退出:底色发灰,或暗色面积太大。
// 口径见 docs/image-prompts.md。sharp 只在真正读图时加载。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// 新口径实测:封面 231-236,配图 227-233。旧的深底封面 38-46,发粉灰的旧配图 204-208。
export const MIN_LUMINANCE = 210;

export function parseNote(slug, text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const field = (key) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  return { slug, pubDate: field('pubDate'), cover: field('cover'), coverAlt: field('coverAlt') };
}

// 草稿也算:同一批里先出图的那几篇,后出的也要避开。
export function recentNotes(notes, n) {
  return notes
    .filter((note) => note.cover && note.pubDate)
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate) || a.slug.localeCompare(b.slug))
    .slice(0, n);
}

export async function luminance(file) {
  const { default: sharp } = await import('sharp');
  const { channels } = await sharp(file).stats();
  const [r, g = r, b = r] = channels.map((c) => c.mean);
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
}

export async function checkImages(files, min = MIN_LUMINANCE) {
  const results = [];
  for (const file of files) {
    const value = await luminance(file);
    results.push({ file, luminance: value, ok: value >= min });
  }
  return results;
}

export async function contactSheet(files, out, { cols = 4, cell = 480, gap = 8 } = {}) {
  const { default: sharp } = await import('sharp');
  const height = Math.round((cell * 9) / 16);
  const rows = Math.ceil(files.length / cols);
  const composite = await Promise.all(files.map(async (file, i) => ({
    input: await sharp(file).resize(cell, height, { fit: 'cover' }).png().toBuffer(),
    left: gap + (i % cols) * (cell + gap),
    top: gap + Math.floor(i / cols) * (height + gap),
  })));
  await sharp({
    create: { width: gap + cols * (cell + gap), height: gap + rows * (height + gap), channels: 3, background: '#ffffff' },
  }).composite(composite).png().toFile(out);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...rest] = process.argv.slice(2);
  const notesDir = fileURLToPath(new URL('../src/content/notes/', import.meta.url));
  if (cmd === 'recent') {
    const outFlag = rest.indexOf('--out');
    const out = outFlag >= 0 ? resolve(rest[outFlag + 1]) : join(tmpdir(), 'baize-recent-covers.png');
    const n = Number(rest.find((a, i) => /^\d+$/.test(a) && i !== outFlag + 1)) || 8;
    const notes = readdirSync(notesDir)
      .filter((name) => /\.mdx?$/.test(name))
      .map((name) => parseNote(name.replace(/\.mdx?$/, ''), readFileSync(join(notesDir, name), 'utf8')));
    const picked = recentNotes(notes, n).map((note) => ({ ...note, file: join(notesDir, note.cover) }));
    const present = picked.filter((note) => existsSync(note.file));
    for (const note of picked.filter((p) => !present.includes(p))) console.warn(`notes: ${note.slug}: cover file not here, run \`pnpm media:pull\``);
    if (!present.length) { console.error('notes: no cover files found'); process.exit(1); }
    for (const note of present) console.log(`${String(await luminance(note.file)).padStart(3)}  ${note.pubDate}  ${note.slug}\n     ${note.coverAlt ?? '(no coverAlt)'}`);
    console.log(`notes: ${present.length} covers, newest first, left to right -> ${await contactSheet(present.map((p) => p.file), out)}`);
  } else if (cmd === 'check') {
    if (!rest.length) { console.error('usage: pnpm notes:image-check <image...>'); process.exit(1); }
    const results = await checkImages(rest.map((f) => resolve(f)));
    for (const r of results) console.log(`${String(r.luminance).padStart(3)}  ${r.ok ? 'ok      ' : 'TOO DARK'}  ${basename(r.file)}`);
    const dark = results.filter((r) => !r.ok);
    if (dark.length) {
      console.error(`notes: ${dark.length} image(s) below ${MIN_LUMINANCE}. Regenerate with the bright spec in docs/image-prompts.md.`);
      process.exit(1);
    }
  } else {
    console.error('usage: node scripts/note-images.mjs recent [n] [--out <png>] | check <image...>');
    process.exit(1);
  }
}
