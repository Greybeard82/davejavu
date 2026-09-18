import { NextResponse } from 'next/server';
import { getPayPalToken } from '@/lib/paypal';

// PayPal webhook receiver.
//
// This endpoint used to be the fulfilment path for single-photo purchases:
// it parsed a `${photoId}|${tier}` custom_id, EXIF-stamped the master,
// inserted a purchase row, minted a download token and emailed the buyer.
// That whole path has been removed (PAY-08). It was unreachable from the UI,
// and unlike the basket path it never checked the captured amount or currency
// against PRICES, writing price_paid from the price table regardless of what
// was actually paid.
//
// Fulfilment now happens only in app/api/basket/complete, which binds the
// PayPal order to a basket and verifies amount and currency before granting
// anything. Nothing calls into this file to do that.
//
// The route itself stays because PAYPAL_WEBHOOK_ID is configured in PayPal and
// points here. Removing the file would make PayPal retry against a 404 and
// eventually disable the webhook. Signature verification is kept so a forged
// POST is still rejected, and verified events are acknowledged and logged.

async function verifyWebhookSignature(request, rawBody) {
  try {
    const headers = {
      auth_algo:         request.headers.get('paypal-auth-algo'),
      cert_url:          request.headers.get('paypal-cert-url'),
      transmission_id:   request.headers.get('paypal-transmission-id'),
      transmission_sig:  request.headers.get('paypal-transmission-sig'),
      transmission_time: request.headers.get('paypal-transmission-time'),
    };

    if (!Object.values(headers).every(Boolean)) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const token = await getPayPalToken();
    const res = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...headers,
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(rawBody),
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return false;
    const result = await res.json();
    return result.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}

export async function POST(request) {
  const rawBody = await request.text();

  try {
    const verified = await verifyWebhookSignature(request, rawBody);
    if (!verified) {
      console.warn('PayPal webhook signature verification failed');
      return NextResponse.json({ error: 'Signature invalid' }, { status: 401 });
    }

    // Acknowledged, not acted on. Logged so a capture that never reached
    // basket/complete is still visible when reconciling against PayPal.
    const event = JSON.parse(rawBody);
    console.log('PayPal webhook received', {
      eventType: event.event_type,
      orderId: event.resource?.supplementary_data?.related_ids?.order_id,
      captureId: event.resource?.id,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook unhandled error', err);
    // Still 200 so PayPal does not retry; the line above is the audit trail.
    return NextResponse.json({ received: true, error: 'Internal error logged' });
  }
}
