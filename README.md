# Joei (上映)

> 🌏 [日本語 (このページ)](./README.md) ・ [한국어](./README.ko.md)

「**今、日本で観られる映画**」を、日本語と韓国語で表示するサイト。
TMDB API の `region=JP` を軸に、日本で実際に上映中・近日公開の作品だけを見せる。

```
/ja              上映中
/ja/upcoming     近日公開
/ja/movies/[id]  詳細

/ko              상영 중
/ko/upcoming     개봉 예정
/ko/movies/[id]  상세
```

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local の TMDB_READ_TOKEN を v4 Read Access Token に置き換える
npm run dev
```

`http://localhost:3000` にアクセスすると `Accept-Language` を見て `/ja` または `/ko` にリダイレクトする。

### スクリプト

| script | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバ |
| `npm run build` | プロダクションビルド |
| `npm run start` | ビルド成果物の起動 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |

## 設計メモ

### 1. サービス名「Joei」の由来

**「上映」(じょうえい)** の音読み。短く、検索・記憶しやすく、和の文脈にも合う。
プロジェクト名・パッケージ名・ヘッダーロゴすべてで `Joei` (Inter `font-medium tracking-tight`) に統一。

### 2. なぜ `region=JP` 固定で、`language` だけ locale 連動か

サービスの核は「**日本で観られる作品**」という市場のスライス。
ここで `region` を切り替えると、別の市場の作品集合が出てしまい、コンセプトが崩れる。
一方、利用者(在日コリアン / 観光客 / 留学生 etc.) には**読みやすい言語**を提供したい。
よって `region=JP` は固定、`language` だけ `ja-JP` / `ko-KR` を切り替える。

### 3. なぜ TMDB を直叩きせず API Route でプロキシしたか

- **キーの隠蔽**: v4 Read Token をクライアントバンドルに乗せない。`NEXT_PUBLIC_` も使わない。
- **キャッシュの統制**: アプリ側で `Cache-Control` を一元管理し、locale 別に分離する。
- **観測性**: `requestId` 付きの構造化ログを TMDB 呼び出し単位で残せる。
- **耐障害性**: 429 / 5xx の指数バックオフ再試行を1ヶ所に閉じ込められる。

### 4. キャッシュ戦略 `s-maxage=300, stale-while-revalidate=600`

5分は新作の入れ替えサイクルに対して十分新しく、TMDB 側のレートにも優しい。
SWR=600 で、キャッシュが期限切れでも一旦古いものを返してバックグラウンドで再検証する。
**locale 別キャッシュ**: API Route の URL に `?lang=ja|ko` が入るため、Vercel/Edge は URL 単位でキャッシュを分ける ⇒ 自動で `ja` と `ko` が独立する。

### 5. なぜ Zod を入れたか

外部 API は信用しない。TMDB のレスポンスはフィールドが落ちたり、型が `null` になったりすることが普通にある (`title` / `runtime` / `genre_ids` など)。
Zod でレスポンス境界に**1度だけ**バリデーションを入れ、以降のコードでは信頼できる型で扱う。
失敗時は構造化ログに残して 500 を返す。

### 6. 構造化ログのフィールド設計

1行 1 JSON で `{ ts, level, requestId, route, locale, upstreamStatus, latencyMs, cacheStatus, attempt }` を出す。
**`locale` を必ず含める**理由は、`ja` 版だけで起きる不具合 (例: 日本語タイトル欠損) を切り分けるため。
`requestId` は `crypto.randomUUID()`。クライアントへも `x-request-id` で返すので、ユーザー報告から該当ログを直引きできる。

### 7. タイトルフォールバックロジック

```ts
const display = (movie.title ?? "").trim() || movie.original_title;
```

`title` (locale 別の現地語タイトル) が空文字 / 空白 / 未配信のケースは普通にあるので、原題に落とす。
`null` だけでなく**空白文字**まで落とすのがポイント。

### 8. なぜ next-intl か

- App Router 親和性: `[locale]` セグメント + `getRequestConfig` で素直に書ける。
- ボイラープレートが少ない: `createMiddleware` がほぼそのまま使える。
- メッセージファイルを JSON で持てるので、Phrase / Crowdin 連携や翻訳者への受け渡しがしやすい。

### 9. 改善余地

- 劇場別フィルタ (TMDB では取れないので別ソース要)
- 英語 (en) など locale 追加: `LANGUAGE_MAP` と `messages/` に1組足すだけで済むよう設計してある

## ディレクトリ構成

```
src/
  app/
    [locale]/
      layout.tsx              # html, font, header
      page.tsx                # 上映中
      upcoming/page.tsx       # 近日公開
      movies/[id]/page.tsx    # 詳細
    api/tmdb/
      now-playing/route.ts
      upcoming/route.ts
      movies/[id]/route.ts
  components/
    header.tsx
    locale-switcher.tsx
    movie-card.tsx
    movie-grid.tsx
    countdown.tsx
    category-filter.tsx
    ui/                       # card / badge / button / skeleton
  lib/
    tmdb/
      client.ts               # fetch + retry + log
      schemas.ts              # zod
      language.ts
      types.ts
    api.ts                    # SSR から自分の API Route を呼ぶ
    logger.ts
    utils.ts
  i18n/
    config.ts
    request.ts
    navigation.ts
messages/
  ja.json
  ko.json
middleware.ts
```

## 環境変数

```
TMDB_READ_TOKEN=...                            # 必須 (v4 Read Access Token)
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

`NEXT_PUBLIC_` プレフィックスは**使わない**。クライアント側で TMDB を直接叩くこともしない。
