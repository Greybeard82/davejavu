import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { ExifTool } from 'exiftool-vendored';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getPayPalToken, PRICES, TIER_LABELS } from '@/lib/paypal';
import { getDownloadUrl } from '@/lib/cloudinary';

const resend = new Resend(process.env.RESEND_API_KEY);

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

async function stampExif(fileBuffer, { buyerEmail, captureId, orderId, tier, purchaseDate }) {
  const exiftool = new ExifTool();
  const tmpIn  = join(tmpdir(), `${randomUUID()}.jpg`);
  const tmpOut = join(tmpdir(), `${randomUUID()}.jpg`);
  try {
    await writeFile(tmpIn, fileBuffer);
    await exiftool.write(tmpIn, {
      Copyright:                  'DAVEJAVU — All rights reserved. Licensed for personal use only.',
      Artist:                     'DAVEJAVU',
      'XMP-xmpRights:UsageTerms': 'Personal use license — see davejavu.com/license',
      'IPTC:CopyrightNotice':     'DAVEJAVU',
      'IPTC:SpecialInstructions': `Buyer: ${buyerEmail} | Order: ${orderId} | Capture: ${captureId} | Tier: ${tier} | Date: ${purchaseDate}`,
      'XMP-dc:Description':       `Buyer: ${buyerEmail} | PayPal capture: ${captureId} | Tier: ${tier} | ${purchaseDate}`,
    }, ['-overwrite_original', '-o', tmpOut]);
    return await readFile(tmpOut);
  } finally {
    await exiftool.end();
    await unlink(tmpIn).catch(() => {});
    await unlink(tmpOut).catch(() => {});
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

    const event = JSON.parse(rawBody);
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ received: true });
    }

    const capture = event.resource;
    const orderId = capture.supplementary_data?.related_ids?.order_id;
    const captureId = capture.id;

    const token = await getPayPalToken();
    const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = await orderRes.json();

    const customId = order.purchase_units?.[0]?.custom_id || '';
    const [photoId, tier] = customId.split('|');

    if (!photoId || !PRICES[tier]) {
      console.error('Webhook: bad custom_id', customId);
      return NextResponse.json({ error: 'Bad custom_id' }, { status: 400 });
    }

    const payer = order.payer;
    const buyerEmail = payer?.email_address || '';
    const buyerName  = `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim();
    const purchaseDate = new Date().toISOString();

    const supabase = createAdminClient();

    // Idempotency guard
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('paypal_order_id', orderId)
      .single();
    if (existing) return NextResponse.json({ received: true, duplicate: true });

    const { data: photo } = await supabase
      .from('photos')
      .select('id, cloudinary_id, storage_path')
      .eq('id', photoId)
      .single();
    if (!photo) {
      console.error('Webhook: photo not found', photoId);
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // EXIF stamp — attempt, fall back gracefully on any failure
    let stampedPath = null;
    const { data: fileData } = await supabase.storage.from('photos').download(photo.storage_path);
    if (fileData) {
      try {
        const fileBuffer = Buffer.from(await fileData.arrayBuffer());
        const stamped = await stampExif(fileBuffer, { buyerEmail, captureId, orderId, tier, purchaseDate });
        stampedPath = `stamped/${orderId}_${tier}.jpg`;
        await supabase.storage.from('photos').upload(stampedPath, stamped, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      } catch (exifErr) {
        console.error('EXIF stamping failed, using Cloudinary fallback', exifErr);
        stampedPath = null;
      }
    }

    // Store purchase
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .insert({
        buyer_email:       buyerEmail,
        buyer_name:        buyerName,
        photo_id:          photoId,
        photo_title:       order.purchase_units?.[0]?.description?.split(' — ')[0] || '',
        license_tier:      tier,
        price_paid:        PRICES[tier],
        paypal_order_id:   orderId,
        paypal_capture_id: captureId,
        purchase_date:     purchaseDate,
        exif_stamped:      !!stampedPath,
      })
      .select()
      .single();

    if (purchaseErr || !purchase) {
      console.error('Webhook: purchase insert failed', purchaseErr);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // Store download token (14-day expiry)
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('download_tokens')
      .insert({ purchase_id: purchase.id, photo_id: photoId, email: buyerEmail, expires_at: expiresAt })
      .select()
      .single();

    if (tokenErr || !tokenRow) {
      console.error('Webhook: token insert failed', tokenErr);
      return NextResponse.json({ error: 'Token error' }, { status: 500 });
    }

    // Build download URL — stamped file if available, else Cloudinary tier URL
    let downloadUrl;
    if (stampedPath) {
      const { data: signed } = await supabase.storage
        .from('photos')
        .createSignedUrl(stampedPath, 60, { download: true });
      downloadUrl = signed?.signedUrl;
    }
    if (!downloadUrl) {
      downloadUrl = getDownloadUrl(photo.cloudinary_id, tier);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const tokenDownloadUrl = `${siteUrl}/api/download/${tokenRow.token}`;
    const tierLabel = TIER_LABELS[tier] || tier;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: buyerEmail,
      subject: 'Your DAVEJAVU download is ready',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:32px 0">
          <h2 style="font-size:22px;margin-bottom:8px">Thanks for buying, ${buyerName || 'friend'}!</h2>
          <p style="color:#555;margin-bottom:24px">Payment confirmed. Your download link is valid for <strong>14 days</strong>.</p>
          <div style="background:#f4f3ef;border-radius:4px;padding:20px 24px;margin-bottom:24px">
            <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px">License tier</p>
            <p style="margin:0 0 16px;font-weight:700;font-size:16px">${tierLabel}</p>
            <a href="${tokenDownloadUrl}"
               style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 24px;font-size:13px;border-radius:4px;font-weight:600">
              Download your file
            </a>
          </div>
          <p style="color:#555;font-size:13px;line-height:1.6">
            This file is licensed to you for personal use. Print it, hang it, share it with family,
            use it as a wallpaper. Please don't resell it, redistribute the file, or use it for
            commercial purposes without contacting me first.
            Full license terms at <a href="${siteUrl}/en/license" style="color:#c8783a">davejavu.com/license</a>.
          </p>
          <p style="color:#aaa;font-size:12px;margin-top:24px">
            If your link expires, reply to this email and I'll send a fresh one.
            PayPal order: ${orderId}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook unhandled error', err);
    // Still return 200 so PayPal doesn't retry — log for manual investigation
    return NextResponse.json({ received: true, error: 'Internal error logged' });
  }
}
