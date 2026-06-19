import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  theme?: "dark-fuchsia" | "romantic-elegant" | "neon-party";
}

export function PageShell({
  children,
  className,
  theme = "dark-fuchsia",
}: PageShellProps) {
  const themeClass =
    theme === "romantic-elegant"
      ? "theme-romantic-elegant"
      : theme === "neon-party"
        ? "theme-neon-party"
        : "theme-dark-fuchsia";

  return (
    <div className={cn("min-h-full flex flex-col", themeClass, className)}>
      {children}
    </div>
  );
}
