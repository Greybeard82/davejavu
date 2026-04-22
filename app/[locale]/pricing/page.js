import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return {
    title: `${t('title')} — DAVEJAVU`,
    description: t('subtitle'),
  };
}

export default async function PricingPage({ params }) {
  const { locale } = await params;
  return <PricingContent locale={locale} />;
}

function PricingContent({ locale }) {
  const t = useTranslations('pricing');

  const steps = [
    { n: '01', title: t('step1Title'), desc: t('step1Desc') },
    { n: '02', title: t('step2Title'), desc: t('step2Desc') },
    { n: '03', title: t('step3Title'), desc: t('step3Desc') },
  ];

  return (
    <div className="max-w-[1800px] mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-16 mb-16">
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">{t('title')}</h1>
        <p className="text-sm text-mid-gray mt-3 leading-relaxed max-w-lg">{t('subtitle')}</p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">

        {/* Small */}
        <div className="border border-[#d1d1d1] bg-white p-8 flex flex-col">
          <p className="text-[10px] uppercase tracking-[4px] text-mid-gray mb-4">{t('smallTitle')}</p>
          <p className="text-4xl font-700 text-charcoal mb-1">{t('smallPrice')}</p>
          <p className="text-xs text-mid-gray mb-6">{t('smallSize')}</p>
          <p className="text-sm text-charcoal leading-relaxed flex-1">{t('smallUse')}</p>
        </div>

        {/* Full Resolution — highlighted */}
        <div className="border border-charcoal bg-charcoal p-8 flex flex-col">
          <p className="text-[10px] uppercase tracking-[4px] text-white/50 mb-4">{t('fullTitle')}</p>
          <p className="text-4xl font-700 text-white mb-1">{t('fullPrice')}</p>
          <p className="text-xs text-white/50 mb-6">{t('fullSize')}</p>
          <p className="text-sm text-white/80 leading-relaxed flex-1">{t('fullUse')}</p>
        </div>

        {/* Business */}
        <div className="border border-[#d1d1d1] bg-[#f4f3ef] p-8 flex flex-col">
          <p className="text-[10px] uppercase tracking-[4px] text-mid-gray mb-4">{t('businessTitle')}</p>
          <p className="text-4xl font-700 text-charcoal mb-1">—</p>
          <p className="text-xs text-mid-gray mb-6">&nbsp;</p>
          <p className="text-sm text-charcoal leading-relaxed flex-1">{t('businessDesc')}</p>
          <Link
            href={`/${locale}/contact`}
            className="mt-8 inline-block text-center py-3 px-6 border border-charcoal text-charcoal text-xs uppercase tracking-[3px] font-600 hover:bg-charcoal hover:text-white transition-colors"
          >
            {t('businessCta')}
          </Link>
        </div>

      </div>

      {/* How it works */}
      <div className="border-t border-[#e8e8e8] pt-16 mb-16">
        <h2 className="text-[10px] uppercase tracking-[4px] text-mid-gray mb-12">{t('howItWorks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.n}>
              <p className="text-3xl font-700 text-[#e8e8e8] mb-4 leading-none">{step.n}</p>
              <p className="text-sm font-600 text-charcoal mb-2 uppercase tracking-wider">{step.title}</p>
              <p className="text-sm text-mid-gray leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note + CTA */}
      <div className="border-t border-[#e8e8e8] pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-xs text-mid-gray leading-relaxed max-w-md">{t('note')}</p>
          <Link href={`/${locale}/license`} className="text-xs text-orange hover:underline mt-1 inline-block">
            {t('licenseLink')}
          </Link>
        </div>
        <Link
          href={`/${locale}`}
          className="shrink-0 px-8 py-4 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors"
        >
          {t('ctaPortfolio')}
        </Link>
      </div>

    </div>
  );
}
