"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Movie } from "@/lib/tmdb/schemas";
import { ANIME_GENRE_ID, type Category } from "@/lib/tmdb/types";
import type { Locale } from "@/i18n/config";
import { MovieGrid } from "./movie-grid";
import { MovieCard } from "./movie-card";
import { Countdown } from "./countdown";
import { cn } from "@/lib/utils";

const CATEGORIES: Category[] = ["all", "japanese", "foreign", "anime"];

type SortKey = "default" | "release" | "rating";
type SortDir = "asc" | "desc";
const SORT_KEYS: SortKey[] = ["default", "release", "rating"];

function applySort(list: Movie[], key: SortKey, dir: SortDir): Movie[] {
  if (key === "default") return list;
  const sorted = [...list].sort((a, b) => {
    if (key === "release") {
      const ad = a.release_date || "";
      const bd = b.release_date || "";
      // 빈 문자열은 항상 뒤로
      if (!ad && !bd) return 0;
      if (!ad) return 1;
      if (!bd) return -1;
      return ad.localeCompare(bd);
    }
    return (a.vote_average ?? 0) - (b.vote_average ?? 0);
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

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

function isFutureOrToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr + "T00:00:00+09:00");
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  return target.getTime() >= now.setHours(0, 0, 0, 0);
}

export interface MovieListInfiniteProps {
  endpoint?: "now-playing" | "upcoming" | "search";
  initialMovies: Movie[];
  initialPage: number;
  totalPages: number;
  locale: Locale;
  futureOnly?: boolean;
  showCountdown?: boolean;
  showCategoryFilter?: boolean;
  extraParams?: Record<string, string>;
}

export function MovieListInfinite({
  endpoint,
  initialMovies,
  initialPage,
  totalPages,
  locale,
  futureOnly = false,
  showCountdown = false,
  showCategoryFilter = true,
  extraParams,
}: MovieListInfiniteProps) {
  const t = useTranslations("filter");
  const tSort = useTranslations("sort");
  const tCommon = useTranslations("common");

  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [page, setPage] = useState(initialPage);

  // 부모가 initialMovies 를 갱신할 때 (예: favorites 의 낙관적 제거/복구) 동기화
  useEffect(() => {
    setMovies(initialMovies);
    setPage(initialPage);
  }, [initialMovies, initialPage]);
  const [active, setActive] = useState<Category>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const next = page + 1;
      const params = new URLSearchParams({
        lang: locale,
        page: String(next),
      });
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) params.set(k, v);
      }
      const res = await fetch(`/api/tmdb/${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { results?: Movie[] };
      const incoming = data.results ?? [];
      setMovies((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      });
      setPage(next);
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, endpoint, locale, extraParams, tCommon]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  let visible = movies;
  if (futureOnly) {
    visible = visible.filter((m) => isFutureOrToday(m.release_date ?? ""));
  }
  if (active !== "all") {
    visible = visible.filter((m) => matches(m, active));
  }
  visible = applySort(visible, sortKey, sortDir);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showCategoryFilter ? (
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
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-inter text-xs text-zinc-400">
            {tSort("label")}
          </span>
          {SORT_KEYS.map((key) => {
            const isActive = key === sortKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  isActive
                    ? "bg-accent text-white"
                    : "ring-1 ring-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {tSort(key)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            disabled={sortKey === "default"}
            aria-label={tSort(sortDir)}
            title={tSort(sortDir)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50",
              sortKey === "default" && "opacity-40 pointer-events-none"
            )}
          >
            {sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {visible.length === 0 && !loading ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          {tCommon("empty")}
        </p>
      ) : (
        <MovieGrid>
          {visible.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              locale={locale}
              footer={
                showCountdown ? (
                  <Countdown releaseDate={m.release_date ?? ""} />
                ) : undefined
              }
            />
          ))}
        </MovieGrid>
      )}

      <div ref={sentinelRef} className="flex justify-center py-8">
        {loading ? (
          <span className="font-inter text-xs text-zinc-400">
            {tCommon("loading")}
          </span>
        ) : !hasMore ? (
          <span className="font-inter text-xs text-zinc-400">
            {tCommon("end")}
          </span>
        ) : null}
        {error ? (
          <button
            type="button"
            onClick={loadMore}
            className="font-inter text-xs text-red-500 underline"
          >
            {error}
          </button>
        ) : null}
      </div>
    </div>
  );
}
