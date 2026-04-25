export const maxDuration = 60; // seconds — needed for image stamp+upload per item

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPayPalToken, PRICES, TIER_LABELS } from '@/lib/paypal';
import { Resend } from 'resend';
import sharp from 'sharp';

async function stampAndStore(supabase, { storagePath, cloudinaryId, tier, orderId, buyerEmail, photoTitle, purchaseDate }) {
  try {
    let buffer;

    // Always fetch from Supabase Storage original for best quality
    if (!storagePath) throw new Error('No storage path — cannot generate download');
    const { data: signed } = await supabase.storage.from('photos').createSignedUrl(storagePath, 120);
    if (!signed?.signedUrl) throw new Error('Could not get signed URL for original');
    const res = await fetch(signed.signedUrl);
    if (!res.ok) throw new Error(`Supabase Storage fetch failed: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());

    // For web_small: resize so shortest side = 2000px, preserving aspect ratio
    if (tier === 'web_small') {
      buffer = await sharp(buffer)
        .resize(2000, 2000, { fit: 'outside', withoutEnlargement: true })
        .toBuffer();
    }

    const stamped = await sharp(buffer)
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: `© ${new Date(purchaseDate).getFullYear()} David Martins / DAVEJAVU — davejavuphoto.com`,
            Artist: 'David Martins / DAVEJAVU',
            ImageDescription: `Licensed to: ${buyerEmail} | Order: ${orderId} | Personal use only`,
            Software: 'DAVEJAVU',
          },
        },
      })
      .jpeg({ quality: 95 })
      .toBuffer();

    const storagePath = `stamped/${orderId}_${tier}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(storagePath, stamped, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw new Error(error.message);
    return storagePath;
  } catch (err) {
    console.error('stampAndStore failed (non-fatal):', err.message);
    return null;
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function POST(request) {
  try {
    const { orderId, basketId } = await request.json();
    if (!orderId || !basketId)
      return NextResponse.json({ error: 'Missing orderId or basketId' }, { status: 400 });

    console.log('basket/complete called', { orderId, basketId });
    const supabase = createAdminClient();

    // Idempotency — check purchases by paypal_order_id, return existing tokens if found
    const { data: existingPurchases } = await supabase
      .from('purchases')
      .select('id, photo_title, license_tier, price_paid')
      .eq('paypal_order_id', orderId);

    if (existingPurchases?.length > 0) {
      const links = [];
      for (const p of existingPurchases) {
        const { data: tokenRow } = await supabase
          .from('download_tokens')
          .select('token')
          .eq('purchase_id', p.id)
          .single();
        if (tokenRow) {
          links.push({
            title: p.photo_title,
            tier: TIER_LABELS[p.license_tier] || p.license_tier,
            price: p.price_paid,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${tokenRow.token}`,
          });
        }
      }
      return NextResponse.json({ links });
    }

    // Verify PayPal order is COMPLETED
    const token = await getPayPalToken();
    const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = await orderRes.json();
    if (order.status !== 'COMPLETED')
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });

    // Load basket
    const { data: basket, error: basketErr } = await supabase.from('baskets').select('*').eq('id', basketId).single();
    console.log('basket loaded', basket, basketErr);
    if (!basket) return NextResponse.json({ error: 'Basket not found' }, { status: 404 });

    const payer = order.payer;
    const buyerEmail = payer?.email_address || '';
    const buyerName = `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim();
    const purchaseDate = new Date().toISOString();
    const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const links = [];

    for (const item of basket.items) {
      console.log('processing item', JSON.stringify(item));
      const { data: photo, error: photoErr } = await supabase
        .from('photos')
        .select('id, cloudinary_id, storage_path, photo_translations(locale, title)')
        .eq('id', item.photoId)
        .single();
      console.log('photo lookup result', photo, photoErr);
      if (!photo) continue;
      const photoTitle = photo.photo_translations?.find((t) => t.locale === 'en')?.title
        || photo.photo_translations?.[0]?.title
        || item.title;

      console.log('inserting purchase for photo', photo.id, photoTitle);
      const { data: purchase, error: purchaseErr } = await supabase.from('purchases').insert({
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        photo_id: photo.id,
        photo_title: photoTitle,
        license_tier: item.tier,
        price_paid: PRICES[item.tier],
        paypal_order_id: orderId,
        paypal_capture_id: captureId,
        purchase_date: purchaseDate,
        exif_stamped: false,
      }).select().single();

      if (purchaseErr) { console.error('purchase insert error', JSON.stringify(purchaseErr)); continue; }

      // Stamp EXIF metadata and store in Supabase — non-blocking best-effort
      const stamped = await stampAndStore(supabase, {
        storagePath: photo.storage_path,
        cloudinaryId: photo.cloudinary_id,
        tier: item.tier,
        orderId,
        buyerEmail,
        photoTitle,
        purchaseDate,
      });
      if (stamped) {
        await supabase.from('purchases').update({ exif_stamped: true }).eq('id', purchase.id);
      }

      const { data: tokenRow, error: tokenErr } = await supabase.from('download_tokens').insert({
        purchase_id: purchase.id,
        photo_id: photo.id,
        email: buyerEmail,
        expires_at: expiresAt,
        basket_id: basketId,
      }).select().single();

      if (tokenErr) { console.error('token insert error', JSON.stringify(tokenErr)); continue; }

      links.push({
        title: photoTitle,
        tier: TIER_LABELS[item.tier] || item.tier,
        price: PRICES[item.tier],
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${tokenRow.token}`,
      });
    }

    await supabase.from('baskets').update({ status: 'completed', buyer_email: buyerEmail }).eq('id', basketId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const linkRows = links.map((l) => `
      <tr>
        <td style="padding:20px 0;border-bottom:1px solid #ece9e3">
          <p style="margin:0 0 4px;font-weight:700;font-size:15px;color:#36454F;letter-spacing:-0.2px">${esc(l.title)}</p>
          <p style="margin:0;font-size:12px;color:#8a8a8a;text-transform:uppercase;letter-spacing:1px">${esc(l.tier)} &nbsp;·&nbsp; €${esc(l.price)}</p>
        </td>
        <td style="padding:20px 0 20px 24px;border-bottom:1px solid #ece9e3;white-space:nowrap;text-align:right">
          <a href="${l.url}" style="display:inline-block;background:#F07E2F;color:#ffffff;text-decoration:none;padding:10px 22px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Download</a>
        </td>
      </tr>
    `).join('');

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: buyerEmail,
      subject: 'Your DAVEJAVU downloads are ready',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:48px 24px">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">

        <!-- Header -->
        <tr>
          <td style="border-bottom:2px solid #36454F;padding-bottom:24px;margin-bottom:32px">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#36454F">DAVEJAVU</p>
            <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a8a8a">Landscape &amp; Cityscape Photography</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:36px 0 8px">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#36454F;line-height:1.3">Your photos are ready,<br>${esc(buyerName || 'friend')}.</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 32px">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#8a8a8a;line-height:1.7">Thank you for your purchase. Your download links are active for <strong style="color:#36454F">14 days</strong>. Save the files somewhere safe once you've downloaded them.</p>
          </td>
        </tr>

        <!-- Download links -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${linkRows}
            </table>
          </td>
        </tr>

        <!-- Note -->
        <tr>
          <td style="padding:32px 0 0">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#8a8a8a;line-height:1.8">These files are licensed for personal use — print them, frame them, set them as wallpaper. Please don't redistribute or use them commercially. <a href="${siteUrl}/en/license" style="color:#F07E2F;text-decoration:none">Full licence terms →</a></p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:32px 0"><div style="border-top:1px solid #ece9e3"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#b0b0b0;line-height:1.8">Questions? Reply to this email or write to <a href="mailto:contact@davejavuphoto.com" style="color:#b0b0b0">contact@davejavuphoto.com</a><br>
            PayPal order: ${esc(orderId)}<br>
            <a href="${siteUrl}" style="color:#b0b0b0;text-decoration:none">davejavuphoto.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ links });
  } catch (err) {
    console.error('basket/complete error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
