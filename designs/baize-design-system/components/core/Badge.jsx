import React from "react";

export function Badge({
  children,
  tone = "neutral",
  className = "",
  ...rest
}) {
  const classes = [
    "bz-badge",
    `bz-badge--${tone}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
