import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  Inter,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Serif_JP,
  Nanum_Myeongjo,
  DM_Serif_Display,
} from "next/font/google";
import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/config";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/ui/toaster";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-jp",
  display: "swap",
});

const notoKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-kr",
  display: "swap",
});

const serifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif-jp",
  display: "swap",
});

const serifKR = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif-ko",
  display: "swap",
});

const brandFont = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-brand",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!(locales as readonly string[]).includes(locale)) {
    return { title: "Joei" };
  }
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const meta = messages.meta as { siteName: string; siteDescription: string };
  return {
    title: {
      default: `Joei — ${meta.siteDescription}`,
      template: `%s${messages.meta.titleSuffix}`,
    },
    description: meta.siteDescription,
    openGraph: {
      title: `Joei — ${meta.siteDescription}`,
      description: meta.siteDescription,
      siteName: meta.siteName,
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const messages = await getMessages();

  const bodyVar = locale === "ko" ? "--font-noto-kr" : "--font-noto-jp";
  const serifVar = locale === "ko" ? "--font-serif-ko" : "--font-serif-jp";

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoJP.variable} ${notoKR.variable} ${serifJP.variable} ${serifKR.variable} ${brandFont.variable}`}
    >
      <body
        style={
          {
            ["--font-body" as string]: `var(${bodyVar})`,
            ["--font-serif" as string]: `var(${serifVar})`,
          } as React.CSSProperties
        }
        className="min-h-screen bg-zinc-50 text-zinc-900"
      >
        <NextIntlClientProvider locale={locale as Locale} messages={messages}>
          <ToastProvider>
            <div className="flex min-h-screen flex-col">
              <Header locale={locale as Locale} />
              <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
                {children}
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
