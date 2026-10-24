import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  // 函数形式的 schema 才能拿到 image() helper:把 frontmatter 里的相对图片路径
  // (cover: ./media/x.png)在构建期解析成 ImageMetadata,供 <Image> 优化。
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // <title> 与 og:title 用;h1 仍是 title。只在 title 太长、搜索结果会被截断时填。
      seoTitle: z.string().optional(),
      description: z.string(),
      lang: z.enum(['zh-CN', 'en']).default('zh-CN'),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.enum(['AI普及', 'AI编程', '企业落地', '安全可信', 'Loop与方法论', '案例复盘']),
      relatedService: z.string().optional(),
      ctaVariant: z.enum(['consulting', 'api']).default('consulting'),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      author: z.string().default('白泽明理'),
      draft: z.boolean().default(false),
      // 英文篇专用:翻译时中文源文件的 sha256 前 12 位,`pnpm i18n:status` 据此判断译文是否过期。
      sourceHash: z.string().regex(/^[0-9a-f]{12}$/).optional(),
      howto: z
        .object({
          name: z.string(),
          steps: z.array(z.object({ name: z.string(), text: z.string() })).min(2),
        })
        .optional(),
    }),
});

export const collections = { notes };
