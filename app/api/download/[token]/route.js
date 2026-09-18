import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { MASTERS_BUCKET } from '@/lib/storage';

export async function GET(_request, { params }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('download_tokens')
    .select('*, purchases(license_tier, paypal_order_id, photo_id)')
    .eq('token', token)
    .single();

  if (error || !data) {
    return htmlResponse('This download link is invalid.', 404);
  }

  if (new Date(data.expires_at) < new Date()) {
    return htmlResponse('This download link has expired. Email contact@davejavuphoto.com and I\'ll send a fresh one.', 410);
  }

  const tier = data.purchases?.license_tier;

  // The ONLY thing we serve is the licensed, EXIF-stamped derivative produced
  // from the master. We never fall back to a Cloudinary display copy (that is
  // the free, 1920px, watermark-by-URL gallery image — PAY-03) or to the raw
  // unstamped master. If the stamped file is missing, the download is not ready.
  const stampedPath = data.purchases?.paypal_order_id
    ? `stamped/${data.purchases.paypal_order_id}_${tier}.jpg`
    : null;

  if (stampedPath) {
    const { data: signed } = await supabase.storage
      .from(MASTERS_BUCKET)
      .createSignedUrl(stampedPath, 60, { download: true });

    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl);
    }
  }

  // Paid, but the licensed file is not ready (stamping failed or is pending).
  // Never hand over a display copy — tell the buyer it is being prepared.
  return htmlResponse(
    'Your download is being prepared. If it does not arrive shortly, email contact@davejavuphoto.com with your order reference and I\'ll sort it out right away.',
    503
  );
}

function htmlResponse(message, status) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
    <title>DAVEJAVU — Download</title>
    <style>body{font-family:sans-serif;background:#0a0a0a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px}
    h1{font-size:1.4rem;margin-bottom:12px}p{color:#aaa;font-size:.9rem;max-width:420px;line-height:1.6}
    a{color:#c8783a;margin-top:20px;display:inline-block;font-size:.85rem}</style>
    </head><body>
    <h1>Download unavailable</h1>
    <p>${message}</p>
    <a href="mailto:${process.env.RESEND_FROM_EMAIL || 'hello@davejavu.com'}">Contact photographer</a>
    </body></html>`,
    { status, headers: { 'Content-Type': 'text/html' } }
  );
}
