import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { fetchMovieDetail } from "@/lib/api";
import { FavoritesList } from "@/components/favorites-list";
import { FAV_COOKIE, parseFavoritesCookie } from "@/lib/favorites";
import { locales, type Locale } from "@/i18n/config";
import type { Movie } from "@/lib/tmdb/schemas";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const t = await getTranslations("favorites");

  const ids = parseFavoritesCookie(cookies().get(FAV_COOKIE)?.value);

  if (ids.length === 0) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </header>
        <p className="py-16 text-center text-sm text-zinc-500">{t("empty")}</p>
      </div>
    );
  }

  const settled = await Promise.all(
    ids.map((id) =>
      fetchMovieDetail(String(id), locale as Locale).catch(() => null)
    )
  );
  const movies: Movie[] = settled
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .map((m) => ({
      ...m,
      genre_ids:
        m.genre_ids && m.genre_ids.length > 0
          ? m.genre_ids
          : (m.genres ?? []).map((g) => g.id),
    }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-5xl">
          {t("title")}
        </h1>
        <p className="font-inter text-sm text-zinc-500">
          {t("count", { count: movies.length })}
        </p>
      </header>

      <FavoritesList initialMovies={movies} locale={locale as Locale} />
    </div>
  );
}
