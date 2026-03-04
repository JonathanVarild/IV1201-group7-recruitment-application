import { useTranslations } from "next-intl";

const PrivacyPage = () => {
  const t = useTranslations("Footer");
  const tPrivacy = useTranslations("PrivacyPage");

  return (
    <div className="container mx-auto max-w-lg">
      <h1 className="text-3xl font-bold mt-6 text-center">{t("privacyPolicy")}</h1>
      <h5 className="text-sm text-gray-500 text-center mt-2 mb-10">{tPrivacy("effectiveDate")}: XXXX-XX-XX</h5>

      <div className="space-y-5 mt-6">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer aliquet sagittis leo, non bibendum justo pretium non. Aenean et arcu sit amet metus finibus molestie.
          Fusce ut ipsum vulputate ex venenatis rhoncus ut ut neque. Aliquam sollicitudin, elit ac sodales bibendum, mauris ligula malesuada libero, ac consequat lectus elit eu
          leo. Pellentesque nibh mauris, vehicula nec faucibus vitae, rutrum eu sapien. Curabitur vulputate euismod ligula, vel imperdiet velit faucibus in. Interdum et malesuada
          fames ac ante ipsum primis in faucibus. Vivamus dignissim nulla ac volutpat commodo. Duis aliquet lacinia nulla ac venenatis.
        </p>
        <p className="py-2"></p>
        <p>
          Nam et pulvinar metus. Fusce bibendum aliquet eleifend. Donec id bibendum eros. Nulla malesuada pretium ante nec iaculis. Donec rhoncus risus interdum, porta tortor ut,
          aliquet sem. Aliquam augue metus, feugiat nec tellus in, interdum molestie sem. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut
          suscipit, libero ac rutrum eleifend, velit eros finibus erat, a rhoncus eros tellus id nulla. Donec vel lobortis orci, nec ullamcorper lectus. Ut lobortis id dolor quis
          pharetra. Interdum et malesuada fames ac ante ipsum primis in faucibus.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
