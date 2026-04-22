export function getTranslation(translations, locale) {
  return (
    translations?.find((t) => t.locale === locale) ||
    translations?.find((t) => t.locale === 'en') ||
    {}
  );
}
