// pnpm i18n:links [--fix]:英文笔记里的 <NoteLink>,目标已有英文版时,链接文字应等于那篇的英文 title。
// 目标还没英文版时,译者只能自译链接文字;等目标出了英文版,这些链接就和 title 对不上。每批翻译收尾跑一次。
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LINK = /<NoteLink slug="([^"]+)">([\s\S]*?)<\/NoteLink>/g;

export function alignLinks(src, titleOf) {
  const drift = [];
  const out = src.replace(LINK, (whole, slug, text) => {
    const title = titleOf(slug);
    if (!title || text.trim() === title) return whole;
    drift.push({ slug, text: text.trim(), title });
    return `<NoteLink slug="${slug}">${title}</NoteLink>`;
  });
  return { out, drift };
}

export function readTitles(enDir) {
  const titles = new Map();
  for (const f of readdirSync(enDir).filter((n) => n.endsWith('.mdx'))) {
    const m = readFileSync(join(enDir, f), 'utf8').match(/^title:\s*(.+)$/m);
    if (m) titles.set(f.slice(0, -'.mdx'.length), m[1].trim().replace(/^(['"])(.*)\1$/, '$2'));
  }
  return titles;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const enDir = fileURLToPath(new URL('../src/content/notes/en', import.meta.url));
  const fix = process.argv.includes('--fix');
  const titles = existsSync(enDir) ? readTitles(enDir) : new Map();
  let total = 0;
  for (const slug of titles.keys()) {
    const file = join(enDir, `${slug}.mdx`);
    const { out, drift } = alignLinks(readFileSync(file, 'utf8'), (s) => titles.get(s));
    for (const d of drift) console.log(`${slug} -> ${d.slug}\n  link:  ${d.text}\n  title: ${d.title}`);
    total += drift.length;
    if (fix && drift.length) writeFileSync(file, out);
  }
  console.log(`${total} drifted link(s)${fix ? ' fixed' : ''}`);
  if (total && !fix) process.exitCode = 1;
}
