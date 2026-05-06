"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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

export function FavoriteButton({
  movieId,
  size = "sm",
  className,
}: {
  movieId: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = useTranslations("favorites");
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const ids = parseFavoritesCookie(readCookie(FAV_COOKIE));
    setActive(ids.includes(movieId));
    setMounted(true);

    function onExternalToggle(e: Event) {
      const detail = (
        e as CustomEvent<{ movieId: number; active: boolean }>
      ).detail;
      if (!detail || detail.movieId !== movieId) return;
      setActive(detail.active);
    }
    window.addEventListener("joei:fav-toggle", onExternalToggle);
    return () => window.removeEventListener("joei:fav-toggle", onExternalToggle);
  }, [movieId]);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const ids = parseFavoritesCookie(readCookie(FAV_COOKIE));
    const next = ids.includes(movieId)
      ? ids.filter((id) => id !== movieId)
      : [...ids, movieId];
    writeCookie(FAV_COOKIE, serializeFavorites(next));
    const isActive = next.includes(movieId);
    setActive(isActive);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("joei:fav-toggle", {
          detail: { movieId, active: isActive },
        })
      );
    }
  }

  const dim = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? t("remove") : t("add")}
      title={active ? t("remove") : t("add")}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1 transition-colors",
        active
          ? "text-rose-500 hover:bg-rose-50"
          : "text-zinc-300 hover:text-rose-400 hover:bg-zinc-100",
        !mounted && "opacity-0",
        className
      )}
    >
      <Heart
        className={cn(dim, active && "fill-rose-500")}
        aria-hidden
      />
    </button>
  );
}
