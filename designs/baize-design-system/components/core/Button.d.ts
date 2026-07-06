import type { ReactNode } from "react";

/**
 * Core call-to-action button for Baize Tech pages.
 * @startingPoint section="Components" subtitle="CTA, secondary, and ghost button states" viewport="700x220"
 */
export interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
  as?: "button" | "a";
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}
