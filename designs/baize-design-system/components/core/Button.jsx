import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  className = "",
  as = "button",
  ...rest
}) {
  const Component = as;
  const classes = [
    "bz-button",
    `bz-button--${variant}`,
    size !== "md" ? `bz-button--${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...rest}>
      {icon ? <span className="bz-button__icon" aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </Component>
  );
}
