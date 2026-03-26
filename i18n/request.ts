import { getRequestConfig } from "next-intl/server";

const locales = ["en", "pt", "es", "fr", "it", "de"];

export default getRequestConfig(async ({ locale }) => {
  // `locale` comes from the `[locale]` route segment.
  if (!locale || !locales.includes(locale)) {
    return {
      locale: "en",
      messages: (await import("../messages/en.json")).default,
    };
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

