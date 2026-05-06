import { logger } from "@/lib/logger";

const BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";

export interface TmdbFetchContext {
  requestId: string;
  route: string;
  locale: string;
}

export class TmdbError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "TmdbError";
  }
}

const RETRY_DELAYS_MS = [300, 900];

function shouldRetry(status: number) {
  return status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tmdbFetch<T>(
  path: string,
  searchParams: Record<string, string>,
  ctx: TmdbFetchContext
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    throw new TmdbError(500, "TMDB_READ_TOKEN is not configured");
  }

  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  let attempt = 0;
  let lastStatus = 0;
  let lastBody = "";
  const started = Date.now();

  while (attempt <= RETRY_DELAYS_MS.length) {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      // Edge/Node 둘 다에서 동작. 캐시는 API Route 레벨에서 헤더로 제어.
      cache: "no-store",
    });

    lastStatus = res.status;

    if (res.ok) {
      const json = (await res.json()) as T;
      logger.info({
        requestId: ctx.requestId,
        route: ctx.route,
        locale: ctx.locale,
        upstreamStatus: res.status,
        latencyMs: Date.now() - started,
        cacheStatus: "MISS",
        attempt,
      });
      return json;
    }

    lastBody = await res.text().catch(() => "");

    if (!shouldRetry(res.status) || attempt === RETRY_DELAYS_MS.length) {
      logger.error({
        requestId: ctx.requestId,
        route: ctx.route,
        locale: ctx.locale,
        upstreamStatus: res.status,
        latencyMs: Date.now() - started,
        attempt,
        error: lastBody.slice(0, 200),
      });
      throw new TmdbError(res.status, `TMDB upstream ${res.status}`);
    }

    const delay = RETRY_DELAYS_MS[attempt];
    logger.warn({
      requestId: ctx.requestId,
      route: ctx.route,
      locale: ctx.locale,
      upstreamStatus: res.status,
      attempt,
      message: `retrying in ${delay}ms`,
    });
    await sleep(delay);
    attempt += 1;
  }

  throw new TmdbError(lastStatus || 500, "TMDB request failed");
}
