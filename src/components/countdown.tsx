import { useTranslations } from "next-intl";
import { Badge } from "./ui/badge";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00+09:00");
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const tokyoNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const diffMs = target.getTime() - tokyoNow.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function Countdown({ releaseDate }: { releaseDate: string }) {
  const t = useTranslations("countdown");
  const days = daysUntil(releaseDate);
  if (days === null) return null;
  if (days < 0) return null;

  if (days === 0) {
    return <Badge variant="accent">{t("releasingToday")}</Badge>;
  }
  return (
    <Badge variant="outline" className="font-inter">
      {t("daysUntilRelease", { days })}
    </Badge>
  );
}
