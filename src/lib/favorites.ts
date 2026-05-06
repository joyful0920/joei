// 쿠키 형식: ",123,456,789," (앞뒤 콤마 포함). 단순 substring 검사로 포함 여부 확인.
// JSON 보다 가벼워서 4KB 한계 안에서 ID 600개 이상 저장 가능.

export const FAV_COOKIE = "joei_fav";
export const FAV_MAX_AGE = 60 * 60 * 24 * 365; // 1년

export function parseFavoritesCookie(value: string | undefined | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function serializeFavorites(ids: number[]): string {
  if (ids.length === 0) return "";
  return "," + ids.join(",") + ",";
}
