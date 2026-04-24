import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/heic', 'image/heif'];

export async function POST(request) {
  const deny = await requireAdmin(request);
  if (deny) return deny;

  try {
    const { filename, contentType, size } = await request.json();

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPG, PNG, TIFF, or HEIC.' }, { status: 400 });
    }
    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50 MB.' }, { status: 400 });
    }

    const photoId = randomUUID();
    const ext = filename.split('.').pop().toLowerCase() || 'jpg';
    const storagePath = `${photoId}/original.${ext}`;

    // Cloudinary signed upload params
    const timestamp = Math.round(Date.now() / 1000);
    const cloudinaryPublicId = `davejavu/display/${photoId}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, public_id: cloudinaryPublicId },
      process.env.CLOUDINARY_API_SECRET,
    );

    // Supabase Storage signed upload URL
    const supabase = createAdminClient();
    const { data: signedData, error: signedError } = await supabase.storage
      .from('photo-masters')
      .createSignedUploadUrl(storagePath);

    if (signedError) throw new Error(`Storage: ${signedError.message}`);

    return NextResponse.json({
      photoId,
      storagePath,
      supabaseUploadUrl: signedData.signedUrl,
      cloudinary: {
        signature,
        timestamp,
        publicId: cloudinaryPublicId,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      },
    });
  } catch (err) {
    console.error('upload-init error:', err);
    return NextResponse.json({ error: err.message || 'Failed to initialise upload' }, { status: 500 });
  }
}
