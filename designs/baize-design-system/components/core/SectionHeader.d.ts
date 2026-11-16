import type { ReactNode } from "react";

/** Section heading block for Baize Tech page modules. */
export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  className?: string;
}
