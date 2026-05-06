"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ANIME_GENRE_ID, type Category } from "@/lib/tmdb/types";
import type { Movie } from "@/lib/tmdb/schemas";
import type { Locale } from "@/i18n/config";
import { MovieGrid } from "./movie-grid";
import { MovieCard } from "./movie-card";
import { cn } from "@/lib/utils";

const CATEGORIES: Category[] = ["all", "japanese", "foreign", "anime"];

function classify(movie: Movie): Category {
  const isAnime = (movie.genre_ids ?? []).includes(ANIME_GENRE_ID);
  if (isAnime) return "anime";
  if (movie.original_language === "ja") return "japanese";
  return "foreign";
}

function matches(movie: Movie, cat: Category) {
  if (cat === "all") return true;
  return classify(movie) === cat;
}

export function CategoryFilter({
  movies,
  locale,
}: {
  movies: Movie[];
  locale: Locale;
}) {
  const t = useTranslations("filter");
  const tCommon = useTranslations("common");
  const [active, setActive] = useState<Category>("all");

  const filtered = movies.filter((m) => matches(m, active));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "ring-1 ring-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              )}
            >
              {t(cat)}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          {tCommon("empty")}
        </p>
      ) : (
        <MovieGrid>
          {filtered.map((m) => (
            <MovieCard key={m.id} movie={m} locale={locale} />
          ))}
        </MovieGrid>
      )}
    </div>
  );
}
