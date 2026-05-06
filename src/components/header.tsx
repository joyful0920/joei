import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchBar } from "./search-bar";
import { MobileNav } from "./mobile-nav";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-8">
            <Link
              href={`/${locale}`}
              className="group flex items-baseline gap-2"
              aria-label="Joei — 上映"
            >
              <span className="font-brand text-[1.6rem] font-normal leading-none tracking-tight text-zinc-900">
                Joei
              </span>
              <span
                className="font-serif text-sm tracking-wide text-zinc-400 transition-colors group-hover:text-zinc-600"
                lang="ja"
              >
                上映
              </span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-zinc-600 sm:flex">
              <Link
                href={`/${locale}`}
                className="transition-colors hover:text-zinc-900"
              >
                {t("nowPlaying")}
              </Link>
              <Link
                href={`/${locale}/upcoming`}
                className="transition-colors hover:text-zinc-900"
              >
                {t("upcoming")}
              </Link>
              <Link
                href={`/${locale}/favorites`}
                className="transition-colors hover:text-zinc-900"
              >
                {t("favorites")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <SearchBar locale={locale} />
            </div>
            <LocaleSwitcher currentLocale={locale} />
            <MobileNav locale={locale} />
          </div>
        </div>

        {/* Mobile-only search row */}
        <div className="pb-3 sm:hidden">
          <SearchBar locale={locale} />
        </div>
      </div>
    </header>
  );
}
