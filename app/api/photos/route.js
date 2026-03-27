import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      photoId,
      cloudinaryId,
      storagePath,
      translations,       // { en: { title, description, alt_text, behind_lens, location }, pt: {...}, ... }
      moods,              // string[]
      camera,             // { camera_body, lens, focal_length, aperture, iso, shutter_speed }
      editionMax,         // number | null
      availableForLicense,
      featured,
      published,
    } = body;

    if (!photoId || !cloudinaryId || !storagePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!translations?.en?.title) {
      return NextResponse.json({ error: 'English title is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Insert into photos
    const { error: photoError } = await supabase.from('photos').insert({
      id: photoId,
      cloudinary_id: cloudinaryId,
      storage_path: storagePath,
      edition_max: editionMax || null,
      available_for_license: availableForLicense ?? false,
      featured: featured ?? false,
      published: published ?? false,
    });
    if (photoError) throw new Error(`photos: ${photoError.message}`);

    // Insert translations (only locales with a title filled in)
    const translationRows = Object.entries(translations)
      .filter(([, t]) => t?.title?.trim())
      .map(([locale, t]) => ({
        photo_id: photoId,
        locale,
        title: t.title.trim(),
        description: t.description?.trim() || null,
        alt_text: t.alt_text?.trim() || null,
        behind_lens: t.behind_lens?.trim() || null,
        location: t.location?.trim() || null,
      }));

    if (translationRows.length > 0) {
      const { error: translError } = await supabase.from('photo_translations').insert(translationRows);
      if (translError) throw new Error(`translations: ${translError.message}`);
    }

    // Insert camera metadata (only if at least one field is filled)
    const hasCamera = camera && Object.values(camera).some(v => v?.toString().trim());
    if (hasCamera) {
      const { error: camError } = await supabase.from('photo_metadata').insert({
        photo_id: photoId,
        camera_body: camera.camera_body?.trim() || null,
        lens: camera.lens?.trim() || null,
        focal_length: camera.focal_length?.trim() || null,
        aperture: camera.aperture?.trim() || null,
        iso: camera.iso ? parseInt(camera.iso) : null,
        shutter_speed: camera.shutter_speed?.trim() || null,
      });
      if (camError) throw new Error(`metadata: ${camError.message}`);
    }

    // Insert moods
    if (moods?.length > 0) {
      const { error: moodError } = await supabase.from('photo_moods')
        .insert(moods.map(mood => ({ photo_id: photoId, mood })));
      if (moodError) throw new Error(`moods: ${moodError.message}`);
    }

    return NextResponse.json({ id: photoId });
  } catch (err) {
    console.error('Save photo error:', err);
    return NextResponse.json({ error: err.message || 'Save failed' }, { status: 500 });
  }
}

// Fetch all photos for admin dashboard
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('photos')
      .select(`
        id, cloudinary_id, published, featured, available_for_license,
        edition_max, edition_sold, created_at,
        photo_translations ( locale, title, location )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ photos: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
