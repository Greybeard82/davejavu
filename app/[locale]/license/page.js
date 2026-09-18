import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'license' });
  return { title: `${t('title')} — DAVEJAVU` };
}

export default async function LicensePage({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'license' });

  // Read with raw() rather than t(): the section bodies are long-form legal
  // prose containing apostrophes and currency symbols, and raw() returns them
  // untouched instead of putting them through ICU message parsing.
  const sections = t.raw('sections');

  return (
    <main className="min-h-screen bg-[#FAF9F6] pt-[72px]">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-mid-gray hover:text-orange transition-colors mb-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t('back')}
        </Link>

        <h1 className="text-4xl font-700 text-charcoal mb-2 tracking-tight">{t('title')}</h1>
        <p className="text-xs text-mid-gray mb-12">{t('lastUpdated')}</p>

        <div className="flex flex-col gap-10">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-sm font-700 text-charcoal uppercase tracking-widest mb-3">{s.heading}</h2>
              {s.body.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm text-charcoal leading-relaxed mb-3">{para}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
