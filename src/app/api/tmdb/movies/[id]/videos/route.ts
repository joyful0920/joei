import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch, TmdbError } from "@/lib/tmdb/client";
import { VideosResponseSchema } from "@/lib/tmdb/schemas";
import { isLocale, toTmdbLanguage } from "@/lib/tmdb/language";
import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID();
  const lang = req.nextUrl.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "ja";
  const language = toTmdbLanguage(locale);
  const route = `/api/tmdb/movies/${params.id}/videos`;

  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    // language 없이 모두 받아 클라이언트 측에서 우선순위 결정
    const raw = await tmdbFetch<unknown>(
      `/movie/${params.id}/videos`,
      { language },
      { requestId, route, locale }
    );
    const parsed = VideosResponseSchema.safeParse(raw);
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
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
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
