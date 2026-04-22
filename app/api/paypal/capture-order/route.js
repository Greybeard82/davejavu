import { NextResponse } from 'next/server';
import { getPayPalToken } from '@/lib/paypal';

export async function POST(request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const token = await getPayPalToken();
    const captureRes = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );

    const capture = await captureRes.json();
    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed', capture);
      return NextResponse.json({ error: 'Capture failed' }, { status: 402 });
    }

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    return NextResponse.json({ status: 'COMPLETED', captureId });
  } catch (err) {
    console.error('capture-order error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
