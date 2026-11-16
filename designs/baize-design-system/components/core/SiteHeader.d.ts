export interface SiteHeaderNavItem {
  label: string;
  href: string;
}

/** Sticky website header for Baize Tech marketing pages. */
export interface SiteHeaderProps {
  navItems?: SiteHeaderNavItem[];
  ctaLabel?: string;
  ctaHref?: string;
  logoSrc?: string | null;
  logoAlt?: string;
  className?: string;
}
