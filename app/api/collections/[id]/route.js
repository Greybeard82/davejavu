import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { title, slug, description, published, coverPhotoId, photoIds } = await request.json();
    const supabase = createAdminClient();

    // Update collection row
    const updates = {};
    if (slug !== undefined) updates.slug = slug.trim();
    if (published !== undefined) updates.published = published;
    if (coverPhotoId !== undefined) updates.cover_photo = coverPhotoId || null;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('collections').update(updates).eq('id', id);
      if (error) throw new Error(error.message);
    }

    // Upsert translation
    if (title !== undefined || description !== undefined) {
      const { error } = await supabase
        .from('collection_translations')
        .upsert({
          collection_id: id,
          locale: 'en',
          name: title?.trim() || '',
          title: title?.trim() || '',
          description: description?.trim() || null,
        }, { onConflict: 'collection_id,locale' });
      if (error) throw new Error(error.message);
    }

    // Replace photo associations
    if (photoIds !== undefined) {
      await supabase.from('photo_collections').delete().eq('collection_id', id);
      if (photoIds.length > 0) {
        const { error } = await supabase.from('photo_collections').insert(
          photoIds.map((photoId, i) => ({ collection_id: id, photo_id: photoId, position: i }))
        );
        if (error) throw new Error(error.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
