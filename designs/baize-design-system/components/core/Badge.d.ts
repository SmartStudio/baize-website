import type { ReactNode } from "react";

/** Small label for service type, article category, or status. */
export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "vermilion" | "jade" | "gold";
  className?: string;
}
