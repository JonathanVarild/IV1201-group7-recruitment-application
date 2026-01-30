import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Home({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");

  return <p>{t("title")}</p>;
}
