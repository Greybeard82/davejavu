import { getTranslations } from 'next-intl/server';
import ContactForm from '@/components/ContactForm';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: `${t('title')} — DAVEJAVU`,
    description: t('metaDescription'),
  };
}

export default async function ContactPage({ params, searchParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const resolvedSearch = await searchParams;
  const prefilledPhoto = resolvedSearch?.photo || '';

  return (
    <div className="max-w-2xl mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-16">
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">{t('title')}</h1>
        <p className="text-sm text-mid-gray mt-3 leading-relaxed max-w-md">
          {t('subtitle')}
        </p>
      </div>
      <div className="mt-12">
        <ContactForm locale={locale} prefilledPhoto={prefilledPhoto} />
      </div>
    </div>
  );
}
