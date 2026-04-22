'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const TIER_KEYS = [
  { key: 'web_small', labelKey: 'webSmall', sizeKey: 'webSmallSize', price: 19 },
  { key: 'full_res',  labelKey: 'fullRes',  sizeKey: 'fullResSize',  price: 49 },
];

const PAYPAL_INIT = { clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, currency: 'EUR' };

function PayPalModal({ photo, tier, locale, onClose, onSuccess, onError }) {
  const t = useTranslations('buy');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#FAF9F6] rounded-sm shadow-2xl w-full max-w-sm p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888] hover:text-charcoal transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <p className="text-[10px] uppercase tracking-widest text-mid-gray mb-1">{photo.title}</p>
        <h2 className="font-display text-xl text-charcoal mb-1">{tier.label}</h2>
        <p className="text-xs text-mid-gray mb-6">{tier.size} · <strong className="text-orange">€{tier.price}</strong></p>

        <PayPalButtons
          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 44 }}
          createOrder={async () => {
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoId: photo.id, photoTitle: photo.title, tier: tier.key }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not create order');
            return data.orderId;
          }}
          onApprove={async (data) => {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await res.json();
            if (result.status === 'COMPLETED') {
              onSuccess();
            } else {
              onError(result.error || 'Capture failed');
            }
          }}
          onError={(err) => {
            console.error('PayPal error', err);
            onError(t('paypalError'));
          }}
        />

        <p className="text-[10px] text-mid-gray text-center mt-4">
          Personal use only.{' '}
          <Link href={`/${locale}/license`} className="underline hover:text-orange transition-colors">{t('licenseTerms')}</Link>
        </p>
      </div>
    </div>
  );
}

export default function BuyButtons({ photo, locale = 'en' }) {
  const t = useTranslations('buy');
  const [activeTier, setActiveTier] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (status === 'success') {
    return (
      <div className="p-5 border border-[#d1d1d1] bg-[#f4f3ef] rounded-sm text-center">
        <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8783a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm font-600 text-charcoal mb-1">{t('paymentConfirmed')}</p>
        <p className="text-xs text-mid-gray">{t('paymentConfirmedDesc')}</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={PAYPAL_INIT}>
      <div className="space-y-3">
        {TIER_KEYS.map((tier) => (
          <button
            key={tier.key}
            onClick={() => { setStatus('idle'); setActiveTier({ ...tier, label: t(tier.labelKey), size: t(tier.sizeKey) }); }}
            className="w-full flex items-center justify-between px-5 py-4 border border-[#d1d1d1] hover:border-orange hover:bg-orange/5 transition-all rounded-sm group"
          >
            <div className="text-left">
              <p className="text-sm font-600 text-charcoal group-hover:text-orange transition-colors">{t(tier.labelKey)}</p>
              <p className="text-xs text-mid-gray mt-0.5">{t(tier.sizeKey)}</p>
            </div>
            <span className="text-base font-700 text-orange shrink-0 ml-4">€{tier.price}</span>
          </button>
        ))}
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-600 mt-3">{errorMsg}</p>
      )}

      <p className="text-[10px] text-mid-gray mt-3">
        Personal use only.{' '}
        <Link href={`/${locale}/license`} className="underline hover:text-orange transition-colors">{t('licenseTerms')}</Link>
        {' '}·{' '}
        <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@davejavu.com'}?subject=Commercial%20license%20enquiry`}
           className="underline hover:text-orange transition-colors">
          {t('commercialCta')}
        </a>
      </p>

      {activeTier && (
        <PayPalModal
          photo={photo}
          tier={activeTier}
          locale={locale}
          onClose={() => setActiveTier(null)}
          onSuccess={() => { setActiveTier(null); setStatus('success'); }}
          onError={(msg) => { setActiveTier(null); setErrorMsg(msg); setStatus('error'); }}
        />
      )}
    </PayPalScriptProvider>
  );
}
