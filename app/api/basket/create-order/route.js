import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPayPalToken, PRICES } from '@/lib/paypal';

export async function POST(request) {
  try {
    const { items } = await request.json();
    // items: [{ photoId, title, tier }]

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: 'Empty basket' }, { status: 400 });

    for (const item of items) {
      if (!item.photoId || !PRICES[item.tier])
        return NextResponse.json({ error: `Invalid item: ${item.photoId}` }, { status: 400 });
    }

    // Store basket in Supabase to survive the PayPal redirect
    const supabase = createAdminClient();
    const { data: basket, error: basketErr } = await supabase
      .from('baskets')
      .insert({ items, status: 'pending' })
      .select()
      .single();
    if (basketErr) throw new Error(basketErr.message);

    const token = await getPayPalToken();
    const lineItems = items.map((item) => ({
      name: `${item.title} — ${item.tier === 'full_res' ? 'Full Resolution' : 'Web / Small Print'}`,
      unit_amount: { currency_code: 'EUR', value: PRICES[item.tier].toFixed(2) },
      quantity: '1',
      category: 'DIGITAL_GOODS',
    }));

    const total = items.reduce((sum, item) => sum + PRICES[item.tier], 0).toFixed(2);

    const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: `basket:${basket.id}`,
          description: `DAVEJAVU — ${items.length} photo license${items.length > 1 ? 's' : ''}`,
          amount: {
            currency_code: 'EUR',
            value: total,
            breakdown: { item_total: { currency_code: 'EUR', value: total } },
          },
          items: lineItems,
        }],
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(order.message || 'PayPal error');

    // Save PayPal order ID against the basket
    await supabase.from('baskets').update({ paypal_order_id: order.id }).eq('id', basket.id);

    return NextResponse.json({ orderId: order.id, basketId: basket.id });
  } catch (err) {
    console.error('basket/create-order error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
