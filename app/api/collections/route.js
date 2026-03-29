import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id, slug, published, created_at,
        collection_translations ( locale, title, description ),
        cover:cover_photo_id ( id, cloudinary_id ),
        photo_collections ( photo_id )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ collections: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, slug, description, published, coverPhotoId, photoIds } = await request.json();

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!slug?.trim()) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const supabase = createAdminClient();

    const { data: collection, error: collError } = await supabase
      .from('collections')
      .insert({
        slug: slug.trim(),
        cover_photo_id: coverPhotoId || null,
        published: published ?? false,
      })
      .select('id')
      .single();
    if (collError) throw new Error(collError.message);

    const { error: transError } = await supabase.from('collection_translations').insert({
      collection_id: collection.id,
      locale: 'en',
      title: title.trim(),
      description: description?.trim() || null,
    });
    if (transError) throw new Error(transError.message);

    if (photoIds?.length > 0) {
      const { error: pcError } = await supabase.from('photo_collections').insert(
        photoIds.map((photoId, i) => ({ collection_id: collection.id, photo_id: photoId, position: i }))
      );
      if (pcError) throw new Error(pcError.message);
    }

    return NextResponse.json({ id: collection.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
