import React from "react";

export function Card({
  eyebrow,
  title,
  children,
  action = null,
  className = "",
  ...rest
}) {
  const classes = ["bz-card", className].filter(Boolean).join(" ");

  return (
    <article className={classes} {...rest}>
      {eyebrow ? <div className="bz-card__eyebrow">{eyebrow}</div> : null}
      {title ? <h3 className="bz-card__title">{title}</h3> : null}
      {children ? <div className="bz-card__body">{children}</div> : null}
      {action}
    </article>
  );
}
