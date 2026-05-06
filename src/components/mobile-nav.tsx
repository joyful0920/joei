"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function MobileNav({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const items = [
    { href: `/${locale}`, label: t("nowPlaying") },
    { href: `/${locale}/upcoming`, label: t("upcoming") },
    { href: `/${locale}/favorites`, label: t("favorites") },
  ];

  function close() {
    setOpen(false);
  }

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 top-[var(--header-h,3.75rem)] z-30 bg-zinc-900/10"
            onClick={close}
            aria-hidden
          />
          <div
            id="mobile-nav-panel"
            className="absolute inset-x-0 top-full z-40 border-t border-zinc-200/60 bg-white/95 backdrop-blur-xl"
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-700 hover:bg-zinc-100"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
