import { NextResponse } from 'next/server';
import { getPayPalToken, PRICES } from '@/lib/paypal';

export async function POST(request) {
  try {
    const { photoId, photoTitle, tier } = await request.json();

    if (!photoId || !PRICES[tier]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const price = PRICES[tier];
    const label = tier === 'full_res' ? 'Full Resolution' : 'Web / Small Print';
    const token = await getPayPalToken();

    const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: `${photoId}|${tier}`,
          description: `${photoTitle} — ${label} License`,
          amount: {
            currency_code: 'EUR',
            value: price.toFixed(2),
            breakdown: { item_total: { currency_code: 'EUR', value: price.toFixed(2) } },
          },
          items: [{
            name: `${photoTitle} — ${label}`,
            unit_amount: { currency_code: 'EUR', value: price.toFixed(2) },
            quantity: '1',
            category: 'DIGITAL_GOODS',
          }],
        }],
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error('PayPal create-order error', order);
      return NextResponse.json({ error: order.message || 'PayPal error' }, { status: 502 });
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error('create-order error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
