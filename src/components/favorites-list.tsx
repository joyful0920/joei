"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Movie } from "@/lib/tmdb/schemas";
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

interface ToggleDetail {
  movieId: number;
  active: boolean;
}

export function FavoritesList({
  initialMovies,
  locale,
}: {
  initialMovies: Movie[];
  locale: Locale;
}) {
  const t = useTranslations("favorites");
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const { show } = useToast();

  useEffect(() => {
    function handleToggle(e: Event) {
      const detail = (e as CustomEvent<ToggleDetail>).detail;
      if (!detail) return;
      // off (해제) 일 때만 처리. on 으로 다시 추가는 다른 페이지 시나리오라 무시.
      if (detail.active) return;

      let removed: Movie | undefined;
      setMovies((prev) => {
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
            // 쿠키 복구
            const ids = parseFavoritesCookie(readCookie(FAV_COOKIE));
            if (!ids.includes(target.id)) {
              writeCookie(
                FAV_COOKIE,
                serializeFavorites([...ids, target.id])
              );
            }
            // 상태 복구 (앞에 추가)
            setMovies((prev) =>
              prev.some((m) => m.id === target.id)
                ? prev
                : [target, ...prev]
            );
            // 다른 곳의 FavoriteButton 들도 다시 켜지도록 이벤트 알림
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
    }
    window.addEventListener("joei:fav-toggle", handleToggle);
    return () => window.removeEventListener("joei:fav-toggle", handleToggle);
  }, [show, t]);

  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500">{t("empty")}</p>
    );
  }

  return (
    <MovieListInfinite
      initialMovies={movies}
      initialPage={1}
      totalPages={1}
      locale={locale}
    />
  );
}
