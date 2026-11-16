# Workspace rules for agy

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
