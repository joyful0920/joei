"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { Locale } from "@/i18n/config";

export function SearchBar({ locale }: { locale: Locale }) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams?.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams?.get("q") ?? "");
  }, [searchParams]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full sm:w-72">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="h-9 w-full rounded-full bg-white pl-8 pr-3 text-sm text-zinc-900 ring-1 ring-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </form>
  );
}
