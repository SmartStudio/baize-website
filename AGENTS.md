# Workspace rules for agy

The full Chinese + English note pipeline (brief → agy draft → review → codex images → wiring → English twin → checks → publish) is in `docs/notes-pipeline.md`. Follow its prompt for the step you are asked to do, and do not run steps you were not asked to run.

## Mingli note prose

When writing or rewriting `site/src/content/notes/*.mdx` body copy, **every turn** must start from this English instruction:

**Please remove all mannered prose.**

Apply it as hard constraints:

- Delete contrast-cavity sentences (「不是 X，而是 Y」「真正的关键不在」「故事不是」) and wrap-up slogans.
- Delete empty judgments (「卡点在于」「需要同时具备」「值得注意的是」). Prefer dated facts, clause numbers, and measurable counts.
- Keep locked H1 / FAQ titles / Figure labels. Contrast must come from two processes or two metrics, not rhetoric.
- Tone: internal memo. Short sentences. Clear subjects. Few adjectives.

Do not rely on `CLAUDE.md` for this rule — agy loads this `AGENTS.md` (and `GEMINI.md` / `.agents/rules/*.md`) only.

Locked title / slug / 主词 / 辅词 / NoteLink conventions still follow the human brief and repo content conventions.

## Mingli note images

Note images are not stored in git. They live in Cloudflare R2 as WebP, and git keeps one `.r2` pointer per image. The build pulls them back before `astro build`. Details: `docs/media-r2.md`.

Style comes from one place: fill in the prompt template in `docs/image-prompts.md` and do not write your own style description. All images are bright. The cover has a pale mint background (`#D6F7EC`), matte white objects, one solid jade green (`#14E0A0`) part, and no text. Its composition comes from the note's content: pick a composition type, camera and framing from `docs/image-prompts.md` §2, and make it differ from the last two covers (`pnpm notes:covers 8`). The body figure has a cool white background (`#F4F6F5`) and 3–5 Chinese labels. No dark backgrounds, no grey or beige clay, no humanoid figures or robots.

Every new or redone image follows these steps:

1. Generate the PNG to `site/src/content/notes/media/<slug>-cover.png` or `<slug>-fig.png`.
2. In `site/`, run `pnpm media:push`. It converts each PNG to WebP, deletes the PNG, uploads the WebP to R2, and writes `<name>.webp.r2`.
3. Reference the WebP in the note: `cover: ./media/<slug>-cover.webp` and `import fig from './media/<slug>-fig.webp'`. English notes under `en/` use `../media/...`.
4. `git add` the `.webp.r2` pointers. Image files in `media/` are gitignored; do not force-add a PNG or WebP.

The build fails when a note references `.png`, or references an image that was never pushed.
