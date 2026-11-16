/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly PUBLIC_DEPLOY_TARGET: 'cloudflare' | 'ghpages';
  readonly SITE: string;
  readonly PUBLIC_FORM_ENDPOINT?: string;
}
