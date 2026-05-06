import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "accent";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: "bg-zinc-100 text-zinc-700",
    outline: "ring-1 ring-zinc-200 text-zinc-700",
    accent: "bg-accent text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
