import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch, TmdbError } from "@/lib/tmdb/client";
import { PaginatedMoviesSchema } from "@/lib/tmdb/schemas";
import { isLocale, toTmdbLanguage } from "@/lib/tmdb/language";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const lang = req.nextUrl.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "ja";
  const language = toTmdbLanguage(locale);
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const pageRaw = req.nextUrl.searchParams.get("page") ?? "1";
  const pageNum = Math.max(1, Math.min(500, parseInt(pageRaw, 10) || 1));
  const page = String(pageNum);
  const route = "/api/tmdb/search";

  if (!query) {
    return NextResponse.json(
      { page: 1, results: [], total_pages: 0, total_results: 0 },
      { headers: { "x-request-id": requestId } }
    );
  }

  try {
    const raw = await tmdbFetch<unknown>(
      "/search/movie",
      { query, language, page, include_adult: "false" },
      { requestId, route, locale }
    );
    const parsed = PaginatedMoviesSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error({
        requestId,
        route,
        locale,
        message: "schema validation failed",
        error: parsed.error.message.slice(0, 300),
      });
      return NextResponse.json({ error: "schema_invalid" }, { status: 500 });
    }

    return NextResponse.json(parsed.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "x-request-id": requestId,
      },
    });
  } catch (err) {
    const status = err instanceof TmdbError ? err.status : 500;
    return NextResponse.json(
      { error: "upstream_error", requestId },
      {
        status: status >= 500 ? 502 : status,
        headers: { "x-request-id": requestId },
      }
    );
  }
}
