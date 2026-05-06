"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  ja: "日本語",
  ko: "한국어",
};

export function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname() ?? "/";

  function buildHref(target: Locale) {
    const segments = pathname.split("/");
    if (segments.length > 1 && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = target;
      return segments.join("/") || `/${target}`;
    }
    return `/${target}`;
  }

  return (
    <nav className="flex items-center gap-3 text-sm font-inter">
      {locales.map((loc) => {
        const active = loc === currentLocale;
        return (
          <Link
            key={loc}
            href={buildHref(loc)}
            className={cn(
              "transition-colors",
              active
                ? "font-medium text-zinc-900"
                : "text-zinc-400 hover:text-zinc-700"
            )}
            aria-current={active ? "true" : undefined}
          >
            {LABELS[loc]}
          </Link>
        );
      })}
    </nav>
  );
}
