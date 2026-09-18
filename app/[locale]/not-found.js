'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Without this boundary, notFound() inside a locale segment falls through to
// Next's built-in 404, which is English and unstyled on all six locales.
// Styling deliberately mirrors the existing empty states (favourites, gallery)
// rather than introducing anything new.
export default function LocaleNotFound() {
  const t = useTranslations('notFound');
  const { locale } = useParams();

  return (
    <div className="max-w-2xl mx-auto px-6 pt-[72px] pb-24">
      <div className="text-center py-32">
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">{t('title')}</h1>
        <p className="text-sm text-mid-gray mt-3 leading-relaxed">{t('body')}</p>
        <Link
          href={`/${locale || 'en'}`}
          className="inline-block mt-8 text-xs uppercase tracking-widest text-charcoal hover:text-orange transition-colors border-b border-charcoal hover:border-orange pb-0.5"
        >
          {t('cta')}
        </Link>
      </div>
    </div>
  );
}
