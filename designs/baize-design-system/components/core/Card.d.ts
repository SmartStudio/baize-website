import type { ReactNode } from "react";

/** Flexible card container for services, articles, cases, and method steps. */
export interface CardProps {
  eyebrow?: string;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}
