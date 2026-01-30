import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export default function Home({ params }: { params: { locale: string } }) {
	const { locale } = params;
	setRequestLocale(locale);

	const t = useTranslations("HomePage");

	return <p>{t("title")}</p>;
}
