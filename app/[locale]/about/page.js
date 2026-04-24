import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: `${t('title')} — DAVEJAVU`,
    description: 'Landscape and cityscape photographer.',
  };
}

async function getSignaturePhotos() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('photos')
      .select('id, title, display_url')
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(6);
    return data || [];
  } catch {
    return [];
  }
}

export default async function AboutPage({ params }) {
  const { locale } = await params;
  const photos = await getSignaturePhotos();
  return <AboutContent locale={locale} photos={photos} />;
}

function AboutContent({ locale, photos }) {
  const t = useTranslations('about');

  return (
    <div className="pt-[72px]">

      {/* Hero — replace the gradient div with your own photo once ready */}
      <div className="relative w-full overflow-hidden" style={{ height: 'min(80vh, 680px)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0d0d0d]" />
        <div className="absolute inset-0 flex items-end justify-start p-10 md:p-16 z-10">
          <div className="text-white">
            <p className="text-[10px] uppercase tracking-[4px] text-white/50 mb-3">DAVEJAVU</p>
            <h1 className="text-4xl md:text-6xl font-700 tracking-tight leading-none">
              {t('title')}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-20">

        {/* Story */}
        <section className="grid md:grid-cols-[160px_1fr] gap-8 md:gap-16">
          <h2 className="text-xl font-700 text-charcoal">{t('storyHeading')}</h2>
          <p className="text-lg md:text-xl text-charcoal leading-relaxed font-400">
            {t('storyBody')}
          </p>
        </section>

        <div className="h-px bg-[#e8e8e8]" />

        {/* Philosophy */}
        <section className="grid md:grid-cols-[160px_1fr] gap-8 md:gap-16">
          <h2 className="text-xl font-700 text-charcoal">{t('philosophyHeading')}</h2>
          <p className="text-lg md:text-xl text-charcoal leading-relaxed font-400">
            {t('philosophyBody')}
          </p>
        </section>

        {/* Signature photos — only shown when featured photos exist */}
        {photos.length > 0 && (
          <>
            <div className="h-px bg-[#e8e8e8]" />
            <section>
              <h2 className="text-xl font-700 text-charcoal mb-8">{t('signaturesHeading')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <Link
                    key={photo.id}
                    href={`/${locale}/photo/${photo.id}`}
                    className="block aspect-[4/3] overflow-hidden bg-[#f4f3ef] group"
                  >
                    <img
                      src={photo.display_url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      draggable="false"
                    />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="h-px bg-[#e8e8e8]" />

        {/* Gear / process */}
        <section className="grid md:grid-cols-[160px_1fr] gap-8 md:gap-16">
          <h2 className="text-xl font-700 text-charcoal">{t('gearHeading')}</h2>
          <p className="text-lg md:text-xl text-charcoal leading-relaxed font-400">
            {t('gearBody')}
          </p>
        </section>

        <div className="h-px bg-[#e8e8e8]" />

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl md:text-3xl font-700 text-charcoal tracking-tight mb-3">{t('ctaHeading')}</h2>
          <p className="text-sm text-mid-gray mb-10">{t('ctaBody')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}`}
              className="px-8 py-4 bg-charcoal text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange transition-colors"
            >
              {t('ctaPortfolio')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="px-8 py-4 border border-charcoal text-charcoal text-xs uppercase tracking-[3px] font-600 hover:bg-charcoal hover:text-white transition-colors"
            >
              {t('ctaContact')}
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
