import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MovieGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  );
}
