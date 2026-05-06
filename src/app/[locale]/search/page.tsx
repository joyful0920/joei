import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { fetchSearch } from "@/lib/api";
import { MovieListInfinite } from "@/components/movie-list-infinite";
import { locales, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}) {
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const t = await getTranslations("search");
  const tCommon = await getTranslations("common");

  const query = (searchParams.q ?? "").trim();

  if (!query) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">{t("emptyQuery")}</p>
        </header>
      </div>
    );
  }

  const data = await fetchSearch(locale as Locale, query, 1);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl">
          {t("resultsFor", { query })}
        </h1>
        <p className="font-inter text-sm text-zinc-500">
          {t("totalResults", { count: data.total_results })}
        </p>
      </header>

      {data.results.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          {tCommon("empty")}
        </p>
      ) : (
        <MovieListInfinite
          endpoint="search"
          initialMovies={data.results}
          initialPage={data.page}
          totalPages={data.total_pages}
          locale={locale as Locale}
          extraParams={{ q: query }}
          showCategoryFilter={false}
        />
      )}
    </div>
  );
}
