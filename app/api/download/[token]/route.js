import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getDownloadUrl } from '@/lib/cloudinary';

export async function GET(_request, { params }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('download_tokens')
    .select('*, purchases(license_tier, paypal_order_id, photo_id), photos(storage_path, cloudinary_id)')
    .eq('token', token)
    .single();

  if (error || !data) {
    return htmlResponse('This download link is invalid.', 404);
  }

  if (new Date(data.expires_at) < new Date()) {
    return htmlResponse('This download link has expired. Reply to your purchase email and I\'ll send a fresh one.', 410);
  }

  const tier = data.purchases?.license_tier;
  const storagePath = data.photos?.storage_path;
  const cloudinaryId = data.photos?.cloudinary_id;

  // Try stamped file in Supabase Storage first
  const stampedPath = data.purchases?.paypal_order_id
    ? `stamped/${data.purchases.paypal_order_id}_${tier}.jpg`
    : null;

  if (stampedPath) {
    const { data: signed } = await supabase.storage
      .from('photos')
      .createSignedUrl(stampedPath, 60, { download: true });

    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl);
    }
  }

  // Fallback: Cloudinary URL for the appropriate tier (no watermark)
  if (cloudinaryId) {
    return NextResponse.redirect(getDownloadUrl(cloudinaryId, tier));
  }

  // Last resort: original from Supabase Storage
  if (storagePath) {
    const { data: signed } = await supabase.storage
      .from('photos')
      .createSignedUrl(storagePath, 60, { download: true });

    if (signed?.signedUrl) return NextResponse.redirect(signed.signedUrl);
  }

  return htmlResponse('File not found. Please contact the photographer.', 404);
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
