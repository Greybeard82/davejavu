import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Toggle published / featured / available_for_license
export async function PATCH(request, { params }) {
  const deny = await requireAdmin(request);
  if (deny) return deny;
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Moods update — replace all moods for this photo
    if (Array.isArray(body.moods)) {
      const { error: delErr } = await supabase.from('photo_moods').delete().eq('photo_id', id);
      if (delErr) throw new Error(delErr.message);
      if (body.moods.length > 0) {
        const { error: insErr } = await supabase.from('photo_moods')
          .insert(body.moods.map((mood) => ({ photo_id: id, mood })));
        if (insErr) throw new Error(insErr.message);
      }
      return NextResponse.json({ ok: true });
    }

    const allowed = ['published', 'featured', 'available_for_license'];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { error } = await supabase.from('photos').update(updates).eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete photo — removes from Cloudinary + Supabase Storage + DB
export async function DELETE(request, { params }) {
  const deny = await requireAdmin(request);
  if (deny) return deny;
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get photo record first
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('cloudinary_id, storage_path')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    // Delete from Cloudinary
    if (photo.cloudinary_id) {
      await cloudinary.uploader.destroy(photo.cloudinary_id).catch(console.error);
    }

    // Delete from Supabase Storage
    if (photo.storage_path) {
      await supabase.storage.from('photos').remove([photo.storage_path]).catch(console.error);
    }

    // Delete DB record (cascades to translations, metadata, moods)
    const { error: deleteError } = await supabase.from('photos').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
