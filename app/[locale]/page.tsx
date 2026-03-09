import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center text-white min-h-[80vh]">
      <img src="/roller-coaster-homepage.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
      <h1 className="relative text-6xl font-bold min-w-3xl">{t("heading")}</h1>
      <p className="relative max-w-md text-gray-200 text-2xl min-w-3xl">{t("subheading")}</p>
      <div className="relative flex gap-4">
        <Link
          href={`/${locale}/apply`}
          className="inline-flex items-center rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-black transition-all hover:bg-yellow-300 hover:scale-105 hover:shadow-lg"
        >
          {t("applyButton")}
        </Link>
      </div>
    </main>
  );
}
