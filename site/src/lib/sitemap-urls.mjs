/** 镜像的文件目录保留 base；对搜索引擎公布的 URL 去掉同一个 base。 */
export function canonicalSitemapUrl(url, site, base) {
  const value = new URL(url);
  const origin = new URL(site).origin;
  if (value.origin !== origin) return value.href;

  const relative = new URL(base.endsWith('/') ? base : `${base}/`, origin).pathname;
  const prefix = relative.endsWith('/') ? relative.slice(0, -1) : relative;
  if (prefix && (value.pathname === prefix || value.pathname.startsWith(`${prefix}/`))) {
    value.pathname = value.pathname.slice(prefix.length) || '/';
  }
  return value.href;
}

/** sitemap-index 中的文件位置也从镜像 base 换成正式域，保留其他 XML 属性。 */
export function canonicalSitemapIndex(xml, site, base) {
  return xml.replace(/<loc>([^<]+)<\/loc>/g, (entry, href) => (
    `<loc>${canonicalSitemapUrl(href, site, base)}</loc>`
  ));
}
