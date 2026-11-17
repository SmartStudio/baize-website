# 明理笔记创作流水线（中英文）

一篇明理笔记从选题到上线走八步。写稿和翻译用 agy，出图用 codex，其余是仓库里的脚本。

| 步 | 谁做 | 产物 | 卡点 |
| --- | --- | --- | --- |
| 1. brief | 人（小云锁词） | `local-tests/<slug>/brief.md` | 主词、辅词、slug 定死 |
| 2. 中文稿 | agy | `site/src/content/notes/<slug>.mdx`（`draft: true`） | 文末 POST 块给人看 |
| 3. 审稿 | 人 | 改过的 mdx | **点头才出图** |
| 4. 出图 | codex | `<slug>-cover.png`、`-fig.png`、`-fig-en.png` | `pnpm notes:covers`、`notes:image-check` |
| 5. 接线 | agy 或手改 | mdx 写上 cover、Figure，删 POST 块 | `pnpm media:push`、`pnpm check` |
| 6. 英文稿 | agy | `site/src/content/notes/en/<slug>.mdx` | `sourceHash` |
| 7. 校验 | 脚本 | 两种产物 | `i18n:links --fix`、两次 build + `check:i18n` |
| 8. 发布 | 人点头后 push `master` | CF 主站 + GH 镜像 | 推了就是公开发布 |

写稿规则在 `AGENTS.md`（agy 只读 `AGENTS.md`，不读 `CLAUDE.md`），出图规则在 `docs/image-prompts.md`，富媒体组件在 `docs/notes-rich-media.md`，图片入库在 `docs/media-r2.md`。本页只管顺序和每一步的命令。

## 1. brief

一篇一个目录 `local-tests/<slug>/`（不进构建）。`brief.md` 照下面填，栏目名不要改，后面的提示词按栏目名引用：

```text
搜索意图标题：<H1，问句，12–20 字>
slug：<英文小写-连字符，先 ls site/src/content/notes/ 确认没重名>
分类：<content.config.ts 里的枚举，一般是 案例复盘>
服务：<relatedService，可空> ｜ CTA：<consulting | api>
主词：<进 H1、首段、FAQ 标题>
辅词：<只进 FAQ 第三条>
Figure 标签：<3–5 个，2–6 字>
钩子：<带日期的事实：一条新规、一次更新、一个公开案例>
避开：<已经写过的角度，写上要链过去的 slug>
NoteLink：<2 篇已上线笔记，写「slug｜原标题」，链接文字照抄原标题>
来源：<可点的一手链接，3–6 条>
```

`钩子` 和 `来源` 决定这篇有没有内容。只有观点没有带日期的事实，就别开写。

## 2. agy 写中文稿

agy 只拿到提示词里的东西：不让它调工具，不让它上网，来源正文由人抓好塞进提示词。它把整篇 mdx 打到 stdout，人再放进仓库。

这样做的原因（2026-11-17 试跑）：

- 让 agy 自己读写文件，`agy -p` 无头模式会把需要 `command` 权限的工具自动拒掉，**退出码照样是 0、一个字不写**，跟 codex 的 `image_gen` 是同一类静默失败。放开 `command(*)` 等于让它在仓库里随便跑命令，不放。
- 它查不了来源，又被要求「带日期的事实」，就会编：第一稿编了后台开关名、「十秒内」、「七天至三十天」，还把「欧盟机构自己的会议禁用 AI 助手」写成「欧盟明令禁止」。来源正文给全了，第二稿就没有再编。

先抓来源正文，存到 `local-tests/<slug>/sources/`（网页转纯文本，只留正文那几十行；法条只留要引的几条）。然后拼提示词：

```bash
S=<slug>; T=local-tests/$S; N=site/src/content/notes
{
  echo "Please remove all mannered prose."; echo
  echo "你是明理笔记的写稿人。不要调用任何工具，不要读写文件，不要运行命令。只输出新笔记 .mdx 的全文，从第一行 --- 开始，到 POST 注释块结束，不加代码围栏，不加解释。"
  cat <<'RULES'

要求：
- frontmatter 照样板：title=搜索意图标题，description 80–120 字先给答案，pubDate=今天，category、relatedService、ctaVariant 照 brief，author: 白泽明理，draft: true。不写 cover、coverAlt。
- 不写 import 和 <Figure>：图还没出，接线那一步再加。
- 正文 2,500–3,500 字。第一段直接回答标题。3–4 个 H2，每节至少一条带日期或条款号的事实。
- 正文不放裸链接。事实处用文字写来源（「eWeek 2025 年 8 月报道」「《个人信息保护法》第十九条」）。FAQ 之后加「## 来源」，用 Markdown 链接列出用到的来源。
- 最后一个正文小节是「## <主词>：常见问题」，3 个 H3，第三个用辅词。
- 两处 <NoteLink slug="...">原标题</NoteLink>，slug 和链接文字照抄 brief。不写 [文字](/notes/x/)。
- 日期用阿拉伯数字。法律要求按法域写清楚，企业制度和法条分开写。
- 只写下面来源正文里出现的事实。来源里没有的设置名、天数、阈值、百分比一律不写；企业要自己定的，写「由谁定、写进哪里」。
- 文末放 {/* POST ... */} 注释块：H1、slug、主、辅、FAQ#3、Figure 标签、封面构图建议、NoteLink 列表、来源、「等点头后再出图」。封面构图建议只写一句「哪个东西发生了什么」，只写物体和状态，不写颜色、材质、底座、机器人。
- H1、slug、主词、辅词、Figure 标签不动。
RULES
  echo "pubDate 写 $(date +%F)。"
  echo; echo "===== brief ====="; cat $T/brief.md
  echo; echo "===== 写作规则（AGENTS.md）====="; sed -n '/^## Mingli note prose/,/^## Mingli note images/p' AGENTS.md | sed '$d'
  echo; echo "===== 样板一 ====="; cat $N/hazmat-label-ai-check.mdx
  echo; echo "===== 样板二 ====="; cat $N/ap-three-way-match-ai-exception.mdx
  echo; echo "===== 来源正文（只能用这里出现的事实）====="
  for f in $T/sources/*.txt; do echo "--- $(basename $f)"; cat $f; done
} > $T/write-prompt.txt
```

`sources/` 里每个文件第一行写上原始 URL，agy 才能在「## 来源」里写对链接。运行（`--mode plan` 不改文件；约 1 分钟）：

```bash
agy -p "$(cat $T/write-prompt.txt)" --model gemini-3.8-flash-high --mode plan \
  --print-timeout 15m < /dev/null > $T/draft.mdx 2> $T/write.err
head -3 $T/draft.mdx          # 第一行必须是 ---；空文件就看 write.err
cp $T/draft.mdx $N/$S.mdx
```

## 3. 审稿

人读全文，看三样：事实和来源对得上（随机点开两条来源核对）；没有对照腔和收束金句；POST 块里的封面构图建议说得出「哪个东西发生了什么」。改法：把审稿意见逐条写进一份新提示词（开头同样是 `Please remove all mannered prose.`，接「按意见改完，不要调用任何工具，只输出改好的 .mdx 全文」、意见列表、草稿全文、来源正文），同样 `--mode plan` 跑一次，输出存成 `draft-v2.mdx`。一两句的小错直接手改。改完点头，才进下一步。

审稿时重点查这几类，试跑第一稿全都出现过：来源里没有的设置名和数字；把一个法域的规定写成普遍要求；把截断的来源句子补成更大的结论；和本篇无关的来源事实。

## 4. 出图

按 `docs/image-prompts.md` §2 的四步写封面：先找动作，再选构图类型、镜头、画幅，最后和最近的封面比：

```bash
cd site && pnpm notes:covers 8    # 打印最近 8 篇的亮度和 coverAlt，拼图路径在最后一行
```

再把 §3 模板填好存成 `local-tests/<slug>/image-prompt.txt`，一次出三张（封面、中文配图、英文配图）：

```bash
codex exec -C "$PWD" -s workspace-write --skip-git-repo-check --ephemeral \
  "$(cat local-tests/<slug>/image-prompt.txt)" < /dev/null > local-tests/<slug>/image.log 2>&1
ls -l site/src/content/notes/media/<slug>-*.png          # 退出码 0 不代表文件在
cd site && pnpm notes:image-check src/content/notes/media/<slug>-*.png
```

逐张过 `docs/image-prompts.md` §6 的 QA。不过就让 codex 重出那一张。

## 5. 接线

```bash
cd site && ls src/content/notes/media/*.png   # 先看一眼：push 会处理目录里所有 PNG，不只这一篇
pnpm media:push                              # PNG → WebP，上传 R2，写 .webp.r2 指针，删 PNG
```

`media:push` 不分篇目：`media/` 里别的 PNG（比如别人还没入库的图）也会被转换、上传、删掉原图。目录里有不属于这一篇的 PNG，先移走再跑。

mdx 改四处：

1. frontmatter 加 `cover: ./media/<slug>-cover.webp` 和 `coverAlt`（照实写构图和物体，见 `docs/image-prompts.md` §2）。
2. frontmatter 下面加 `import noteFig from './media/<slug>-fig.webp';`。
3. 第一段后面插 `<Figure src={noteFig} alt="<一句话说图里的步骤>" caption="图：「<主词>」｜「<辅词>」" width="wide" border />`。
4. 删掉 POST 注释块，`draft: true` 改成 `draft: false`。

```bash
pnpm check && pnpm build
```

## 6. agy 写英文稿

在中文稿接线完成之后做（`sourceHash` 要对上定稿）。同样把材料塞进提示词、让 agy 只输出全文：

```bash
S=<slug>; T=local-tests/$S; N=site/src/content/notes
H=$(shasum -a 256 $N/$S.mdx | cut -c1-12)
{
  echo "Please remove all mannered prose."; echo
  echo "Do not call any tools, do not read or write files, do not run commands. Output only the full English .mdx file, starting with the first --- line. No code fences, no explanation."
  cat <<'RULES'

Write the English twin of the Chinese note below, for overseas readers. Rewrite, do not translate sentence by sentence.
- frontmatter: same keys as the English sample. lang: en; author: Baize AI; category keeps the Chinese enum value; relatedService and ctaVariant same as the Chinese file; pubDate today; cover: ../media/ + the Chinese cover file name; English coverAlt describing the same picture; draft: false.
- import noteFig from '../media/' + the Chinese figure file name with -fig-en instead of -fig; same Figure position; caption "Figure: <main keyword> | <secondary keyword>" in English.
- Keep the argument structure, facts, numbers, dates and clause numbers. Replace China-only platforms (WeChat, Tencent Meeting, Feishu, DingTalk) with what overseas readers use, or add one sentence of context. When a Chinese law is cited, name it in English (e.g. China's Personal Information Protection Law, Article 19). Do not invent facts.
- Wrap title, description and coverAlt in single quotes (double any ' inside). An unquoted ": " breaks the YAML and fails the build.
- No Chinese characters anywhere in the file, no RMB prices, no QR codes. Keep <NoteLink slug="..."> tags and slugs as they are; translate their link text.
- FAQ section title "<main keyword>: FAQ"; keep "## Sources" with the same links.
RULES
  echo "pubDate: $(date +%F). sourceHash: '$H'."
  echo "English figure labels: <label 1> / <label 2> / ..."
  echo; echo "===== English sample ====="; cat $N/en/zero-click-search-still-need-seo.mdx
  echo; echo "===== Chinese source ====="; cat $N/$S.mdx
} > $T/translate-prompt.txt
agy -p "$(cat $T/translate-prompt.txt)" --model gemini-3.8-flash-high --mode plan \
  --print-timeout 15m < /dev/null > $T/draft-en.mdx 2> $T/translate.err
head -3 $T/draft-en.mdx && cp $T/draft-en.mdx $N/en/$S.mdx
perl -CSD -ne 'print "$.: $_" if /\p{Han}/ && !/^category:/' $N/en/$S.mdx   # 应该没有输出（category 必须是中文枚举，不算）
```

## 7. 校验

```bash
cd site
export PUBLIC_SITE_URL=https://fxai.ai   # 不设就按 baize.example.com 构建，check:i18n 会报近千条「不是正式域」
pnpm i18n:links --fix            # 英文 NoteLink 的链接文字对齐到目标篇的英文标题
pnpm i18n:status                 # 这篇不应出现在 missing 或 stale 里
pnpm check && pnpm test
pnpm build && pnpm check:i18n
PUBLIC_DEPLOY_TARGET=ghpages PUBLIC_GH_BASE=/baize-website/ pnpm build \
  && node scripts/check-i18n-dist.mjs dist /baize-website/
pnpm build && pnpm preview       # 打开 /notes/<slug>/ 和 /en/notes/<slug>/ 看封面、配图、FAQ
```

`check:i18n` 报的是全站问题，存量的 28 篇缺英文版会报 28 条「中文语言配对错误」。只看这篇有没有新增报错：`pnpm check:i18n 2>&1 | grep <slug>` 应该没有输出。

`pnpm check` 需要 `@astrojs/check`，仓库没装，跑起来会停在安装提示。frontmatter 的 YAML 和 schema 错误由 `pnpm build` 报出来。

## 8. 发布

push 到 `master` 就是公开发布：GH 镜像由 workflow 构建，CF 主站自己拉仓库构建，IndexNow 按笔记路径触发。所以只在人点头后提交：

```bash
git add site/src/content/notes/<slug>.mdx site/src/content/notes/en/<slug>.mdx \
  site/src/content/notes/media/<slug>-*.webp.r2
git commit -m "feat(notes): <slug>"
git push origin master
```

图片本身被 gitignore，`git add` 的只有 `.webp.r2` 指针。上线后 `curl` 主站页面，确认 `og:image` 和 JSON-LD 的 `image` 指向这篇的封面。

## 试跑记录（2026-11-17）

用 `ai-notetaker-external-meeting-consent`（AI 会议助手进外部会议的录音同意）把 1–7 步跑了一遍，没有发布。

| 步 | 用时 | 结果 |
| --- | --- | --- |
| 中文初稿（agy，gemini-3.8-flash-high） | 53 秒 | 结构对。编了 4 处来源里没有的细节，1 处把截断的来源扩大成「欧盟明令禁止」，把一个法域的规定写成普遍要求 |
| 审稿 + agy 改稿 | 46 秒 | 9 条意见全改到；剩 1 处手改。NoteLink 的链接文字是编的，手改成原标题 |
| 出图（codex，3 张一次跑） | 约 3 分钟 | 封面亮度 235、配图 229 / 232，中英文标签逐字正确，构图按「异类 + 俯视」出 |
| 英文稿（agy） | 约 1.5 分钟 | 结构、sourceHash、路径都对；标题含冒号没加引号，构建失败；NoteLink 文字由 `i18n:links --fix` 改对 |
| 两次构建 + check:i18n | — | 这一篇 0 条报错；全站仍是存量的 28 条缺英文配对 |

据此加进上面各步的规则：来源正文塞进提示词、不让 agy 调工具；brief 里 NoteLink 写原标题；英文 frontmatter 加引号；构建前设 `PUBLIC_SITE_URL`；`media:push` 前先看 `media/` 里有没有别人的 PNG。
