import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Movie } from "@/lib/tmdb/schemas";
import type { Locale } from "@/i18n/config";
import { Card } from "./ui/card";
import { FavoriteButton } from "./favorite-button";
import { cn } from "@/lib/utils";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

function displayTitle(m: Movie) {
  return (m.title ?? "").trim() || m.original_title || "";
}

export function MovieCard({
  movie,
  locale,
  footer,
}: {
  movie: Movie;
  locale: Locale;
  footer?: React.ReactNode;
}) {
  const title = displayTitle(movie);
  const poster = movie.poster_path
    ? `${IMAGE_BASE}/w500${movie.poster_path}`
    : null;
  const rating =
    movie.vote_average && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : null;

  return (
    <Link
      href={`/${locale}/movies/${movie.id}`}
      className={cn(
        "group block transition-transform hover:-translate-y-0.5"
      )}
    >
      <Card className="border-0 bg-transparent ring-0">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-zinc-200">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              No poster
            </div>
          )}
        </div>
        <div className="px-1 pt-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900">
            {title}
          </h3>
          {movie.original_title && movie.original_title !== title ? (
            <p className="mt-0.5 line-clamp-1 font-inter text-xs text-zinc-500">
              {movie.original_title}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5 font-inter text-xs text-zinc-500">
              {rating ? (
                <span className="inline-flex items-center gap-0.5 font-medium text-zinc-700">
                  <Star
                    className="h-3 w-3 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                  {rating}
                </span>
              ) : null}
              {rating && movie.release_date ? (
                <span className="text-zinc-300" aria-hidden>
                  ·
                </span>
              ) : null}
              {movie.release_date ? (
                <span className="truncate">{movie.release_date}</span>
              ) : null}
            </div>
            <FavoriteButton movieId={movie.id} />
          </div>
          {footer ? <div className="mt-2">{footer}</div> : null}
        </div>
      </Card>
    </Link>
  );
}
