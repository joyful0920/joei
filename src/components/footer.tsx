import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("meta");
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-zinc-200/70 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-brand text-xl font-normal tracking-tight text-zinc-900">
              Joei
            </span>
            <span
              className="font-serif text-sm tracking-wide text-zinc-400"
              lang="ja"
            >
              上映
            </span>
          </div>
          <p className="max-w-xs leading-relaxed">{t("siteDescription")}</p>
        </div>
        <div className="space-y-2 font-inter sm:text-right">
          <p className="leading-relaxed text-zinc-400 max-w-xs sm:ml-auto">
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
          <p className="text-zinc-400">© {year} Joei</p>
        </div>
      </div>
    </footer>
  );
}
