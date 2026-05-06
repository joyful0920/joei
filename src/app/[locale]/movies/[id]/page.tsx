import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { fetchMovieDetail, fetchMovieVideos, pickBestTrailer } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { locales, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

function displayTitle(m: { title?: string | null; original_title?: string | null }) {
  return ((m.title ?? "").trim() || m.original_title || "").trim();
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  if (!(locales as readonly string[]).includes(params.locale)) return {};
  try {
    const movie = await fetchMovieDetail(params.id, params.locale as Locale);
    const title = displayTitle(movie);
    const description = (movie.overview ?? "").slice(0, 140) || undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: movie.poster_path
          ? [`${IMAGE_BASE}/w780${movie.poster_path}`]
          : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function MovieDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  if (!(locales as readonly string[]).includes(params.locale)) notFound();
  const t = await getTranslations("detail");

  let movie;
  try {
    movie = await fetchMovieDetail(params.id, params.locale as Locale);
  } catch {
    notFound();
  }

  const trailer = await fetchMovieVideos(params.id, params.locale as Locale)
    .then(pickBestTrailer)
    .catch(() => null);

  const title = displayTitle(movie);
  const poster = movie.poster_path
    ? `${IMAGE_BASE}/w500${movie.poster_path}`
    : null;
  const backdrop = movie.backdrop_path
    ? `${IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null;

  return (
    <article className="space-y-10">
      <Link
        href={`/${params.locale}`}
        className="inline-flex items-center text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        {t("back")}
      </Link>

      <div className="grid gap-10 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-zinc-200">
            {poster ? (
              <Image
                src={poster}
                alt={title}
                fill
                sizes="260px"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl">
                {title}
              </h1>
              <FavoriteButton movieId={movie.id} size="md" />
            </div>
            {movie.original_title && movie.original_title !== title ? (
              <p className="font-inter text-sm text-zinc-500">
                {t("originalTitle")}: {movie.original_title}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">{t("releaseDate")}</dt>
              <dd className="font-inter text-zinc-900">
                {movie.release_date || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("runtime")}</dt>
              <dd className="font-inter text-zinc-900">
                {movie.runtime ? `${movie.runtime} ${t("runtimeUnit")}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("rating")}</dt>
              <dd className="font-inter text-zinc-900">
                {movie.vote_average?.toFixed(1) ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("genres")}</dt>
              <dd>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(movie.genres ?? []).length === 0 ? (
                    <span className="text-zinc-400">—</span>
                  ) : (
                    (movie.genres ?? []).map((g) => (
                      <Badge key={g.id} variant="outline">
                        {g.name}
                      </Badge>
                    ))
                  )}
                </div>
              </dd>
            </div>
          </dl>

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-zinc-500">{t("overview")}</h2>
            <p className="leading-relaxed text-zinc-800">
              {movie.overview?.trim() || t("noOverview")}
            </p>
          </section>
        </div>
      </div>

      {trailer ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-500">{t("trailer")}</h2>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-zinc-200">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0`}
              title={trailer.name || title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </section>
      ) : null}

      {backdrop ? (
        <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-zinc-200">
          <Image
            src={backdrop}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}
    </article>
  );
}
