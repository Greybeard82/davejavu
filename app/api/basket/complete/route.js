import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPayPalToken, PRICES, TIER_LABELS } from '@/lib/paypal';
import { Resend } from 'resend';

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
        .select('id, photo_translations(locale, title)')
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
        <td style="padding:12px 0;border-bottom:1px solid #e8e8e8">
          <p style="margin:0 0 4px;font-weight:700;font-size:14px;color:#1a1a1a">${esc(l.title)}</p>
          <p style="margin:0;font-size:12px;color:#888">${esc(l.tier)} · €${esc(l.price)}</p>
        </td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #e8e8e8;white-space:nowrap">
          <a href="${l.url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:8px 16px;font-size:12px;font-weight:600">Download</a>
        </td>
      </tr>
    `).join('');

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: buyerEmail,
      subject: 'Your DAVEJAVU downloads are ready',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:32px 0">
          <h2 style="font-size:22px;margin-bottom:8px">Thanks for buying, ${esc(buyerName || 'friend')}!</h2>
          <p style="color:#555;margin-bottom:24px">Your download links are valid for <strong>14 days</strong>.</p>
          <table style="width:100%;border-collapse:collapse">${linkRows}</table>
          <p style="color:#555;font-size:13px;line-height:1.6;margin-top:24px">
            Personal use only — print, frame, use as wallpaper. Please don't resell or use commercially.
            Full terms at <a href="${siteUrl}/en/license" style="color:#c8783a">davejavuphoto.com/license</a>.
          </p>
          <p style="color:#aaa;font-size:12px;margin-top:24px">PayPal order: ${orderId}</p>
        </div>
      `,
    });

    return NextResponse.json({ links });
  } catch (err) {
    console.error('basket/complete error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
