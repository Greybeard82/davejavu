import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPayPalToken, PRICES, TIER_LABELS } from '@/lib/paypal';
import { getDownloadUrl } from '@/lib/cloudinary';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { orderId, basketId } = await request.json();
    if (!orderId || !basketId)
      return NextResponse.json({ error: 'Missing orderId or basketId' }, { status: 400 });

    // Verify PayPal order is actually COMPLETED
    const token = await getPayPalToken();
    const orderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = await orderRes.json();
    if (order.status !== 'COMPLETED')
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });

    const supabase = createAdminClient();

    // Idempotency — if already fulfilled, return existing tokens
    const { data: existingTokens } = await supabase
      .from('download_tokens')
      .select('token, photo_id, photos(title)')
      .eq('basket_id', basketId);
    if (existingTokens?.length > 0) {
      const links = existingTokens.map((t) => ({
        title: t.photos?.title || t.photo_id,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${t.token}`,
      }));
      return NextResponse.json({ links });
    }

    // Load basket
    const { data: basket } = await supabase.from('baskets').select('*').eq('id', basketId).single();
    if (!basket) return NextResponse.json({ error: 'Basket not found' }, { status: 404 });

    const payer = order.payer;
    const buyerEmail = payer?.email_address || '';
    const buyerName = `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim();
    const purchaseDate = new Date().toISOString();
    const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const links = [];

    for (const item of basket.items) {
      const { data: photo } = await supabase
        .from('photos')
        .select('id, cloudinary_id, title')
        .eq('id', item.photoId)
        .single();
      if (!photo) continue;

      // Insert purchase record
      const { data: purchase } = await supabase.from('purchases').insert({
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        photo_id: photo.id,
        photo_title: photo.title,
        license_tier: item.tier,
        price_paid: PRICES[item.tier],
        paypal_order_id: orderId,
        paypal_capture_id: captureId,
        purchase_date: purchaseDate,
        exif_stamped: false,
      }).select().single();

      // Insert download token
      const { data: tokenRow } = await supabase.from('download_tokens').insert({
        purchase_id: purchase?.id,
        photo_id: photo.id,
        email: buyerEmail,
        expires_at: expiresAt,
        basket_id: basketId,
      }).select().single();

      if (tokenRow) {
        links.push({
          title: photo.title,
          tier: TIER_LABELS[item.tier] || item.tier,
          price: PRICES[item.tier],
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${tokenRow.token}`,
        });
      }
    }

    // Mark basket complete
    await supabase.from('baskets').update({ status: 'completed', buyer_email: buyerEmail }).eq('id', basketId);

    // Send email with all download links
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const linkRows = links.map((l) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e8e8e8">
          <p style="margin:0 0 4px;font-weight:700;font-size:14px;color:#1a1a1a">${l.title}</p>
          <p style="margin:0;font-size:12px;color:#888">${l.tier} · €${l.price}</p>
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
          <h2 style="font-size:22px;margin-bottom:8px">Thanks for buying, ${buyerName || 'friend'}!</h2>
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
