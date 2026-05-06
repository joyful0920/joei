"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MovieDetailSchema,
  type Movie,
  type MovieDetail,
} from "@/lib/tmdb/schemas";
import type { Locale } from "@/i18n/config";
import { useToast } from "@/components/ui/toaster";
import { MovieListInfinite } from "./movie-list-infinite";
import {
  FAV_COOKIE,
  FAV_MAX_AGE,
  parseFavoritesCookie,
  serializeFavorites,
} from "@/lib/favorites";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${FAV_MAX_AGE}; SameSite=Lax`;
}

function withGenreIds(m: MovieDetail): Movie {
  return {
    ...m,
    genre_ids:
      m.genre_ids && m.genre_ids.length > 0
        ? m.genre_ids
        : (m.genres ?? []).map((g) => g.id),
  };
}

async function fetchOneDetail(
  id: number,
  locale: Locale
): Promise<Movie | null> {
  try {
    const res = await fetch(`/api/tmdb/movies/${id}?lang=${locale}`);
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = MovieDetailSchema.safeParse(data);
    if (!parsed.success) return null;
    return withGenreIds(parsed.data);
  } catch {
    return null;
  }
}

export function FavoritesList({ locale }: { locale: Locale }) {
  const t = useTranslations("favorites");
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const { show } = useToast();

  // 마운트 시점에 쿠키 -> detail 병렬 fetch
  useEffect(() => {
    const ids = parseFavoritesCookie(readCookie(FAV_COOKIE));
    if (ids.length === 0) {
      setMovies([]);
      return;
    }
    let cancelled = false;
    Promise.all(ids.map((id) => fetchOneDetail(id, locale))).then((list) => {
      if (cancelled) return;
      setMovies(list.filter((m): m is Movie => m !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // 같은 페이지 안에서 다른 영역의 토글에도 반응 (낙관적 제거 + Undo)
  const handleToggle = useCallback(
    (e: Event) => {
      const detail = (
        e as CustomEvent<{ movieId: number; active: boolean }>
      ).detail;
      if (!detail) return;

      // 추가 (다른 곳에서 찜이 켜진 경우): 페이지에 fetch 후 prepend
      if (detail.active) {
        setMovies((prev) => {
          if (!prev) return prev;
          if (prev.some((m) => m.id === detail.movieId)) return prev;
          // 비어있는 자리에 placeholder 없이 비동기 추가
          fetchOneDetail(detail.movieId, locale).then((newMovie) => {
            if (!newMovie) return;
            setMovies((current) => {
              if (!current) return current;
              if (current.some((m) => m.id === newMovie.id)) return current;
              return [newMovie, ...current];
            });
          });
          return prev;
        });
        return;
      }

      // 제거: 즉시 그리드에서 떼고 Undo 토스트 발행
      let removed: Movie | undefined;
      setMovies((prev) => {
        if (!prev) return prev;
        removed = prev.find((m) => m.id === detail.movieId);
        if (!removed) return prev;
        return prev.filter((m) => m.id !== detail.movieId);
      });
      if (!removed) return;

      const target = removed;
      show({
        message: t("removed"),
        action: {
          label: t("undo"),
          onClick: () => {
            const ids = parseFavoritesCookie(readCookie(FAV_COOKIE));
            if (!ids.includes(target.id)) {
              writeCookie(
                FAV_COOKIE,
                serializeFavorites([...ids, target.id])
              );
            }
            setMovies((prev) =>
              prev
                ? prev.some((m) => m.id === target.id)
                  ? prev
                  : [target, ...prev]
                : [target]
            );
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("joei:fav-toggle", {
                  detail: { movieId: target.id, active: true },
                })
              );
            }
          },
        },
      });
    },
    [locale, show, t]
  );

  useEffect(() => {
    window.addEventListener("joei:fav-toggle", handleToggle);
    return () => window.removeEventListener("joei:fav-toggle", handleToggle);
  }, [handleToggle]);

  if (movies === null) {
    return (
      <p className="py-16 text-center text-sm text-zinc-400">{t("loading")}</p>
    );
  }

  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500">{t("empty")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-inter text-sm text-zinc-500">
        {t("count", { count: movies.length })}
      </p>
      <MovieListInfinite
        initialMovies={movies}
        initialPage={1}
        totalPages={1}
        locale={locale}
      />
    </div>
  );
}
