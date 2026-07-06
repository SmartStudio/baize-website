import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const target = process.env.PUBLIC_DEPLOY_TARGET ?? 'cloudflare';
// canonical 主域恒为 CF；两处构建都用它做 site，从而 sitemap/canonical 去重指向主站
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://baize.example.com';
const GH_BASE = process.env.PUBLIC_GH_BASE ?? '/';

export default defineConfig({
  site: SITE,
  base: target === 'ghpages' ? GH_BASE : '/',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  vite: {
    define: {
      'import.meta.env.PUBLIC_DEPLOY_TARGET': JSON.stringify(target),
    },
  },
});
