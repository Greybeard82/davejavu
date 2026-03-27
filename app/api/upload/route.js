import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createAdminClient } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/heic', 'image/heif'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPG, PNG, TIFF, or HEIC.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    const photoId = randomUUID();
    const ext = file.name.split('.').pop().toLowerCase();
    const storagePath = `${photoId}/original.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload master to Supabase Storage (private)
    const supabase = createAdminClient();
    const { error: storageError } = await supabase.storage
      .from('photo-masters')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (storageError) {
      return NextResponse.json({ error: `Storage error: ${storageError.message}` }, { status: 500 });
    }

    // 2. Upload display copy to Cloudinary (resized, compressed, auto-tagged)
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: photoId,
          folder: 'davejavu/display',
          resource_type: 'image',
          transformation: [
            { width: 1920, height: 1920, crop: 'limit', quality: 65, format: 'jpg' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const tags = [];

    return NextResponse.json({
      photoId,
      cloudinaryId: cloudinaryResult.public_id,
      storagePath,
      tags,
      displayUrl: cloudinaryResult.secure_url,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
