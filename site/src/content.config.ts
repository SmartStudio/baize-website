import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['AI普及', 'AI编程', '企业落地', '安全可信', 'Loop与方法论', '案例复盘']),
    relatedService: z.string().optional(),
    cover: z.string().optional(),
    author: z.string().default('白泽明理'),
    draft: z.boolean().default(false),
    howto: z
      .object({
        name: z.string(),
        steps: z.array(z.object({ name: z.string(), text: z.string() })).min(2),
      })
      .optional(),
  }),
});

export const collections = { notes };
