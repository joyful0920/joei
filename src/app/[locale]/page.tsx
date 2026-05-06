import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { fetchNowPlaying } from "@/lib/api";
import { MovieListInfinite } from "@/components/movie-list-infinite";
import { locales, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const t = await getTranslations("home");

  const data = await fetchNowPlaying(locale as Locale, 1);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-5xl">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </header>

      <MovieListInfinite
        endpoint="now-playing"
        initialMovies={data.results}
        initialPage={data.page}
        totalPages={data.total_pages}
        locale={locale as Locale}
      />
    </div>
  );
}
