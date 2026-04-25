import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TRANSLATE_LOCALES = ['pt', 'es', 'fr', 'it', 'de'];

async function translateFromEnglish(en) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `You are a professional translator for a fine-art photography portfolio called DAVEJAVU.

Translate the following English photography metadata into Portuguese (pt), Spanish (es), French (fr), Italian (it), and German (de).
Preserve the tone — evocative, personal, artistic. Do not add or remove information.

English source:
- title: ${en.title}
- description: ${en.description || ''}
- alt_text: ${en.alt_text || ''}
- behind_lens: ${en.behind_lens || ''}
- location: ${en.location || ''}

Return ONLY a valid JSON object — no markdown, no preamble:
{
  "titles": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "descriptions": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "alt_text": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "behind_lens": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "location": ""
}

Rules:
- location: translate city/country names only if a local equivalent exists, otherwise keep as-is
- If a field is empty in English, return an empty string for all languages
- Titles: keep under 60 characters`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });
  let text = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text);
}

export async function POST(request) {
  const deny = await requireAdmin(request);
  if (deny) return deny;
  try {
    const body = await request.json();
    const {
      photoId,
      cloudinaryId,
      storagePath,
      width,
      height,
      translations,
      moods,
      camera,
      availableForLicense,
      featured,
      published,
      collectionIds,
    } = body;

    if (!photoId || !cloudinaryId || !storagePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!translations?.en?.title) {
      return NextResponse.json({ error: 'English title is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Translate EN into the other 5 languages server-side
    const translated = await translateFromEnglish(translations.en);
    const allTranslations = { ...translations };
    TRANSLATE_LOCALES.forEach(l => {
      allTranslations[l] = {
        title: translated.titles?.[l] || '',
        description: translated.descriptions?.[l] || '',
        alt_text: translated.alt_text?.[l] || '',
        behind_lens: translated.behind_lens?.[l] || '',
        location: translated.location || translations.en.location || '',
      };
    });

    const { error: photoError } = await supabase.from('photos').insert({
      id: photoId,
      cloudinary_id: cloudinaryId,
      storage_path: storagePath,
      width: width || null,
      height: height || null,
      available_for_license: availableForLicense ?? false,
      featured: featured ?? false,
      published: published ?? false,
    });
    if (photoError) throw new Error(`photos: ${photoError.message}`);

    const translationRows = Object.entries(allTranslations)
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

    const hasCamera = camera && Object.values(camera).some(v => v?.toString().trim());

    const inserts = await Promise.all([
      translationRows.length > 0
        ? supabase.from('photo_translations').insert(translationRows)
        : Promise.resolve({ error: null }),
      hasCamera
        ? supabase.from('photo_metadata').insert({
            photo_id: photoId,
            camera_body: camera.camera_body?.trim() || null,
            lens: camera.lens?.trim() || null,
            focal_length: camera.focal_length?.trim() || null,
            aperture: camera.aperture?.trim() || null,
            iso: camera.iso ? parseInt(camera.iso) : null,
            shutter_speed: camera.shutter_speed?.trim() || null,
          })
        : Promise.resolve({ error: null }),
      moods?.length > 0
        ? supabase.from('photo_moods').insert(moods.map(mood => ({ photo_id: photoId, mood })))
        : Promise.resolve({ error: null }),
      collectionIds?.length > 0
        ? supabase.from('photo_collections').insert(
            collectionIds.map((collectionId, i) => ({ collection_id: collectionId, photo_id: photoId, position: i }))
          )
        : Promise.resolve({ error: null }),
    ]);

    const labels = ['translations', 'metadata', 'moods', 'collections'];
    for (let i = 0; i < inserts.length; i++) {
      if (inserts[i].error) throw new Error(`${labels[i]}: ${inserts[i].error.message}`);
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
        id, cloudinary_id, published, featured, available_for_license, created_at,
        photo_translations ( locale, title, location ),
        photo_moods ( mood )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ photos: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
