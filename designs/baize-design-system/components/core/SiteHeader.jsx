import React from "react";

export function SiteHeader({
  navItems = [],
  ctaLabel = "预约咨询",
  ctaHref = "#contact",
  logoSrc = null,
  logoAlt = "白泽明理 Baize Tech",
  className = "",
}) {
  const classes = ["bz-site-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="bz-shell bz-site-header__inner">
        <a className="bz-site-header__brand" href="/">
          {logoSrc ? <img className="bz-site-header__logo" src={logoSrc} alt={logoAlt} /> : null}
          <span className="bz-site-header__wordmark">
            <span className="bz-site-header__mark">白泽明理</span>
            <span className="bz-site-header__latin">Baize Tech</span>
          </span>
        </a>
        <nav className="bz-site-header__nav" aria-label="主导航">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <a className="bz-button bz-button--primary" href={ctaHref}>{ctaLabel}</a>
      </div>
    </header>
  );
}
