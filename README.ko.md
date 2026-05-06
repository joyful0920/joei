# Joei (上映)

> 🌏 [日本語](./README.md) ・ [한국어 (현재 페이지)](./README.ko.md)

「**지금 일본에서 볼 수 있는 영화**」를 일본어와 한국어로 보여주는 사이트입니다.
TMDB API 의 `region=JP` 를 축으로, 일본에서 실제로 상영 중이거나 곧 개봉하는 작품만 노출합니다.

```
/ja              상영 중 (上映中)
/ja/upcoming     개봉 예정 (近日公開)
/ja/movies/[id]  상세

/ko              상영 중
/ko/upcoming     개봉 예정
/ko/movies/[id]  상세
```

## 셋업

```bash
npm install
cp .env.example .env.local
# .env.local 의 TMDB_READ_TOKEN 을 v4 Read Access Token 으로 교체해 주세요
npm run dev
```

`http://localhost:3000` 에 접속하면 `Accept-Language` 를 보고 `/ja` 또는 `/ko` 로 리다이렉트합니다.

### 스크립트

| script              | 설명             |
| ------------------- | ---------------- |
| `npm run dev`       | 개발 서버        |
| `npm run build`     | 프로덕션 빌드    |
| `npm run start`     | 빌드 결과물 실행 |
| `npm run typecheck` | `tsc --noEmit`   |
| `npm run lint`      | `next lint`      |

## 설계 메모

### 1. 서비스명 「Joei」 의 유래

**「上映」(じょうえい)** 의 음독입니다. 짧고 검색·기억하기 쉬우며, 일본 모던 디자인 톤과도 잘 맞습니다.
프로젝트명·패키지명·헤더 로고 모두 `Joei` (Inter `font-medium tracking-tight`) 로 통일했습니다.

### 2. 왜 `region=JP` 는 고정하고, `language` 만 locale 에 연동했나요

서비스의 핵심은 「**일본에서 볼 수 있는 작품**」이라는 시장 슬라이스입니다.
여기서 `region` 을 바꿔 버리면 다른 나라 시장의 작품 집합이 나와 컨셉이 무너지게 됩니다.
한편 사용자(재일한국인 / 관광객 / 유학생 등)에게는 **읽기 편한 언어**를 제공하고 싶었습니다.
그래서 `region=JP` 는 고정한 채, `language` 만 `ja-JP` / `ko-KR` 로 전환하도록 설계했습니다.

### 3. 왜 TMDB 를 직접 호출하지 않고 API Route 로 프록시했나요

- **키 은닉**: v4 Read Token 을 클라이언트 번들에 싣지 않습니다. `NEXT_PUBLIC_` 도 사용하지 않습니다.
- **캐시 통제**: 앱 단에서 `Cache-Control` 을 일원화 관리하고, locale 별로 캐시를 분리할 수 있습니다.
- **관측성**: `requestId` 가 붙은 구조화 로그를 TMDB 호출 단위로 남길 수 있습니다.
- **장애 내성**: 429 / 5xx 에 대한 지수 백오프 재시도를 한 곳에 가둘 수 있습니다.

### 4. 캐시 전략 `s-maxage=300, stale-while-revalidate=600`

5분은 신작 교체 주기에 비해 충분히 신선하고, TMDB 측 레이트 리밋에도 부담이 없는 값입니다.
SWR=600 덕분에 캐시가 만료되어도 일단 오래된 응답을 돌려준 뒤 백그라운드에서 재검증합니다.
**locale 별 캐시**: API Route URL 에 `?lang=ja|ko` 가 포함되므로, Vercel/Edge 가 URL 단위로 캐시를 분리해 `ja` 와 `ko` 가 자동으로 독립됩니다.

### 5. 왜 Zod 를 도입했나요

외부 API 는 그대로 믿지 않습니다. TMDB 응답은 필드가 빠지거나 타입이 `null` 로 오는 경우가 종종 있습니다 (`title` / `runtime` / `genre_ids` 등).
Zod 로 응답 경계에서 **딱 한 번만** 검증하고, 그 이후 코드는 안심할 수 있는 타입으로 다루도록 했습니다.
검증 실패 시에는 구조화 로그를 남기고 500 을 반환합니다.

### 6. 구조화 로그 필드 설계

한 줄에 한 JSON 형태로 `{ ts, level, requestId, route, locale, upstreamStatus, latencyMs, cacheStatus, attempt }` 을 출력합니다.
**`locale` 을 반드시 포함**하는 이유는, `ja` 버전에서만 발생하는 이슈(예: 일본어 제목 누락) 같은 케이스를 분리해서 보기 위함입니다.
`requestId` 는 `crypto.randomUUID()` 로 생성하고, 클라이언트에도 `x-request-id` 헤더로 전달하기 때문에 사용자 리포트에서 해당 로그를 바로 찾아갈 수 있습니다.

### 7. 제목 fallback 로직

```ts
const display = (movie.title ?? "").trim() || movie.original_title;
```

`title` (locale 별 현지 제목) 이 빈 문자열 / 공백 / 미배포인 경우가 흔해서 원제로 폴백합니다.
`null` 뿐 아니라 **공백 문자**까지 떨어뜨리는 게 포인트입니다.

### 8. 왜 next-intl 인가요

- App Router 친화성: `[locale]` 세그먼트 + `getRequestConfig` 로 자연스럽게 작성할 수 있습니다.
- 보일러플레이트가 적은 편입니다. `createMiddleware` 도 거의 그대로 사용 가능합니다.
- 메시지 파일이 JSON 이라 Phrase / Crowdin 같은 도구 연동이나 번역자 핸드오프도 수월합니다.

### 9. 개선 여지

- 극장별 필터 (TMDB 에서는 제공되지 않아 별도 데이터 소스가 필요합니다)
- 영어(en) 등 locale 추가: `LANGUAGE_MAP` 과 `messages/` 에 한 세트만 추가하면 됩니다

## 디렉토리 구조

```
src/
  app/
    [locale]/
      layout.tsx              # html, font, header, footer
      page.tsx                # 상영 중
      upcoming/page.tsx       # 개봉 예정
      movies/[id]/page.tsx    # 상세
      search/page.tsx         # 검색 결과
    api/tmdb/
      now-playing/route.ts
      upcoming/route.ts
      movies/[id]/route.ts
      search/route.ts
  components/
    header.tsx
    footer.tsx
    locale-switcher.tsx
    search-bar.tsx
    movie-card.tsx
    movie-grid.tsx
    movie-list-infinite.tsx   # 무한 스크롤 + 카테고리 / 정렬
    countdown.tsx
    ui/                       # card / badge / button / skeleton
  lib/
    tmdb/
      client.ts               # fetch + retry + log
      schemas.ts              # zod
      language.ts
      types.ts
    api.ts                    # SSR 에서 자기 도메인의 API Route 호출
    logger.ts
    utils.ts
  i18n/
    config.ts
    request.ts
    navigation.ts
  middleware.ts
messages/
  ja.json
  ko.json
```

## 환경 변수

```
TMDB_READ_TOKEN=...                            # 필수 (v4 Read Access Token)
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

`NEXT_PUBLIC_` 접두사는 **사용하지 않습니다**. 클라이언트가 TMDB 를 직접 호출하지도 않습니다.
