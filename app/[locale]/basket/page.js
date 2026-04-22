'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getBasket, removeFromBasket, updateTier, clearBasket } from '@/lib/basket';

const PRICES = { web_small: 19, full_res: 49 };
const TIER_LABELS = { web_small: 'Small  ·  2000px  ·  €19', full_res: 'Full Resolution  ·  Native  ·  €49' };
const PAYPAL_INIT = { clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, currency: 'EUR' };

export default function BasketPage() {
  const { locale } = useParams();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { setItems(getBasket()); }, []);

  const refresh = () => setItems(getBasket());

  const handleRemove = (photoId) => { removeFromBasket(photoId); refresh(); };
  const handleTier = (photoId, tier) => { updateTier(photoId, tier); refresh(); };

  const total = items.reduce((sum, i) => sum + PRICES[i.tier], 0);

  const createOrder = async () => {
    setError('');
    const res = await fetch('/api/basket/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(({ photoId, title, tier }) => ({ photoId, title, tier })) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create order');
    sessionStorage.setItem('davejavu_basket_id', data.basketId);
    return data.orderId;
  };

  const onApprove = async (data, actions) => {
    // Capture the order first so PayPal marks it COMPLETED
    await actions.order.capture();
    const basketId = sessionStorage.getItem('davejavu_basket_id');
    const res = await fetch('/api/basket/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.orderID, basketId }),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error || 'Something went wrong'); return; }
    sessionStorage.setItem('davejavu_download_links', JSON.stringify(result.links));
    clearBasket();
    router.push(`/${locale}/thank-you`);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1800px] mx-auto px-6 pt-[72px] pb-24">
        <div className="pt-16 text-center py-24">
          <p className="text-mid-gray text-sm mb-6">Your basket is empty.</p>
          <Link href={`/${locale}`} className="text-xs uppercase tracking-[3px] font-600 text-orange hover:underline">
            Browse the portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-16 mb-12">
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">Basket</h1>
        <p className="text-sm text-mid-gray mt-2">{items.length} photo{items.length > 1 ? 's' : ''}</p>
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-12 items-start">

        {/* Item list */}
        <div className="flex flex-col divide-y divide-[#e8e8e8] border-t border-[#e8e8e8]">
          {items.map((item) => (
            <div key={item.photoId} className="flex gap-5 py-6 items-start">
              {item.image && (
                <img src={item.image} alt={item.title}
                  className="w-24 h-16 object-cover shrink-0 bg-[#f4f3ef]" draggable="false" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-600 text-charcoal text-sm mb-3">{item.title}</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(TIER_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`tier-${item.photoId}`}
                        value={key}
                        checked={item.tier === key}
                        onChange={() => handleTier(item.photoId, key)}
                        className="accent-orange"
                      />
                      <span className="text-xs text-charcoal">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-700 text-charcoal text-sm mb-3">€{PRICES[item.tier]}</p>
                <button onClick={() => handleRemove(item.photoId)}
                  className="text-[10px] uppercase tracking-widest text-mid-gray hover:text-red-400 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary + PayPal */}
        <div className="border border-[#d1d1d1] bg-white p-8 sticky top-24">
          <h2 className="text-[10px] uppercase tracking-[4px] text-mid-gray mb-6">Order summary</h2>

          <div className="flex flex-col gap-3 mb-6">
            {items.map((item) => (
              <div key={item.photoId} className="flex justify-between text-sm">
                <span className="text-charcoal truncate pr-4">{item.title}</span>
                <span className="text-charcoal font-600 shrink-0">€{PRICES[item.tier]}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#e8e8e8] pt-4 mb-8 flex justify-between">
            <span className="text-sm font-700 text-charcoal">Total</span>
            <span className="text-xl font-700 text-charcoal">€{total}</span>
          </div>

          {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

          <PayPalScriptProvider options={PAYPAL_INIT}>
            <PayPalButtons
              key={`${items.map(i => i.photoId + i.tier).join('-')}`}
              forceReRender={[items, total]}
              style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 44 }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => setError(err.message || 'PayPal error')}
            />
          </PayPalScriptProvider>

          <p className="text-[10px] text-mid-gray text-center mt-4 leading-relaxed">
            Download links sent to your email · valid 14 days
          </p>
        </div>
      </div>
    </div>
  );
}
