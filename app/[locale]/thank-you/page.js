'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

function ThankYouContent() {
  const t = useTranslations('thankYou');
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('order');
    const basketId = searchParams.get('basket');

    if (!orderId || !basketId) { setLoading(false); return; }

    fetch('/api/basket/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, basketId }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.links) setLinks(data.links); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div className="max-w-2xl mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-20 text-center mb-16">
        <div className="w-14 h-14 rounded-full bg-[#f4f3ef] flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F07E2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="text-3xl font-700 text-charcoal tracking-tight mb-3">{t('title')}</h1>
        <p className="text-sm text-mid-gray leading-relaxed max-w-sm mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-sm text-mid-gray py-8">{t('loading')}</div>
      ) : links.length > 0 ? (
        <div className="flex flex-col gap-4 mb-16">
          {links.map((link, i) => (
            <div key={i} className="border border-[#d1d1d1] bg-white p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-700 text-charcoal text-sm">{link.title}</p>
                <p className="text-xs text-mid-gray mt-1">{link.tier} · €{link.price}</p>
              </div>
              <a
                href={link.url}
                className="shrink-0 px-6 py-3 bg-charcoal text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange transition-colors"
              >
                {t('download')}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-mid-gray mb-16 py-8 border border-[#e8e8e8]">
          {t('checkInbox')}
        </div>
      )}

      <div className="text-center">
        <Link href={`/${locale}`} className="text-xs uppercase tracking-[3px] font-600 text-charcoal hover:text-orange transition-colors">
          {t('backToPortfolio')}
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-6 pt-[72px] pb-24 text-center pt-32">
        <p className="text-sm text-mid-gray">Loading…</p>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
