import { copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src', 'styles', 'tokens');
const DEST = join(here, '..', '..', 'designs', 'baize-design-system', 'tokens');

const files = (await readdir(SRC)).filter((f) => f.endsWith('.css'));
for (const f of files) {
  await copyFile(join(SRC, f), join(DEST, f));
  console.log(`pushed ${f} -> designs/baize-design-system/tokens/`);
}
console.log(`done: ${files.length} token files synced to designs/`);
