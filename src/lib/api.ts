import { headers } from "next/headers";
import type { Locale } from "@/i18n/config";
import {
  MovieDetailSchema,
  PaginatedMoviesSchema,
  VideosResponseSchema,
  type MovieDetail,
  type PaginatedMovies,
  type Video,
} from "@/lib/tmdb/schemas";

function baseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function jsonGet<T>(path: string): Promise<T> {
  const res = await fetch(baseUrl() + path, {
    // Vercel/Next 의 데이터 캐시 활용 (API Route 의 s-maxage 와 별개로 SSR 단계도 캐시)
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`api ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchNowPlaying(
  locale: Locale,
  page = 1
): Promise<PaginatedMovies> {
  const raw = await jsonGet<unknown>(
    `/api/tmdb/now-playing?lang=${locale}&page=${page}`
  );
  return PaginatedMoviesSchema.parse(raw);
}

export async function fetchUpcoming(
  locale: Locale,
  page = 1
): Promise<PaginatedMovies> {
  const raw = await jsonGet<unknown>(
    `/api/tmdb/upcoming?lang=${locale}&page=${page}`
  );
  return PaginatedMoviesSchema.parse(raw);
}

export async function fetchMovieDetail(
  id: string,
  locale: Locale
): Promise<MovieDetail> {
  const raw = await jsonGet<unknown>(`/api/tmdb/movies/${id}?lang=${locale}`);
  return MovieDetailSchema.parse(raw);
}

export async function fetchSearch(
  locale: Locale,
  query: string,
  page = 1
): Promise<PaginatedMovies> {
  const q = encodeURIComponent(query);
  const raw = await jsonGet<unknown>(
    `/api/tmdb/search?lang=${locale}&q=${q}&page=${page}`
  );
  return PaginatedMoviesSchema.parse(raw);
}

export async function fetchMovieVideos(
  id: string,
  locale: Locale
): Promise<Video[]> {
  const raw = await jsonGet<unknown>(
    `/api/tmdb/movies/${id}/videos?lang=${locale}`
  );
  const parsed = VideosResponseSchema.parse(raw);
  return parsed.results;
}

export function pickBestTrailer(videos: Video[]): Video | null {
  const youtubeTrailers = videos.filter(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
  if (youtubeTrailers.length === 0) {
    const ytTeasers = videos.filter(
      (v) => v.site === "YouTube" && v.type === "Teaser"
    );
    if (ytTeasers.length === 0) return null;
    return ytTeasers[0];
  }
  // official 우선, 그 안에서 published_at 최신 우선
  const sorted = [...youtubeTrailers].sort((a, b) => {
    if (a.official !== b.official) return a.official ? -1 : 1;
    return (b.published_at ?? "").localeCompare(a.published_at ?? "");
  });
  return sorted[0];
}
