// pnpm i18n:status:列出「有中文、没英文」(missing)和「中文源文件改过、英文没跟上」(stale)的笔记。
// 英文笔记 frontmatter 的 sourceHash = 翻译时中文源文件整份内容的 sha256 前 12 位。
// 只改了错字也会变 stale,要不要重翻由人决定。
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const sourceHash = (content) => createHash('sha256').update(content).digest('hex').slice(0, 12);

export function computeStatus(zh, en) {
  const missing = [...zh].filter(([slug, n]) => !n.draft && !en.has(slug)).map(([slug]) => slug);
  const stale = [...en]
    .filter(([slug, n]) => zh.has(slug) && n.sourceHash !== sourceHash(zh.get(slug).content))
    .map(([slug]) => slug);
  return { missing: missing.sort(), stale: stale.sort() };
}

const frontmatter = (content) => content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

function readDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({ slug: f.slice(0, -'.mdx'.length), content: readFileSync(join(dir, f), 'utf8') }));
}

export function readNotes(notesDir) {
  const zh = new Map(
    readDir(notesDir).map(({ slug, content }) => [
      slug,
      { content, draft: /^draft:\s*true\s*$/m.test(frontmatter(content)) },
    ]),
  );
  const en = new Map(
    readDir(join(notesDir, 'en')).map(({ slug, content }) => [
      slug,
      { sourceHash: frontmatter(content).match(/^sourceHash:\s*['"]?([0-9a-f]{12})['"]?\s*$/m)?.[1] },
    ]),
  );
  return { zh, en };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const notesDir = process.argv[2] ?? fileURLToPath(new URL('../src/content/notes/', import.meta.url));
  const { zh, en } = readNotes(notesDir);
  const { missing, stale } = computeStatus(zh, en);
  console.log(`missing (${missing.length}):`);
  for (const slug of missing) console.log(`  ${slug}  sourceHash: ${sourceHash(zh.get(slug).content)}`);
  console.log(`stale (${stale.length}):`);
  for (const slug of stale) {
    console.log(`  ${slug}  en: ${en.get(slug).sourceHash ?? '(none)'}  zh now: ${sourceHash(zh.get(slug).content)}`);
  }
}
