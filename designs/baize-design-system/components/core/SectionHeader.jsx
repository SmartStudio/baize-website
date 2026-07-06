import React from "react";

export function SectionHeader({
  eyebrow,
  title,
  children,
  className = "",
  ...rest
}) {
  const classes = ["bz-section-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes} {...rest}>
      {eyebrow ? <div className="bz-section-header__eyebrow">{eyebrow}</div> : null}
      <h2 className="bz-section-header__title">{title}</h2>
      {children ? <p className="bz-section-header__body">{children}</p> : null}
    </header>
  );
}
