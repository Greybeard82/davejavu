import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';

const LOCALES = ['pt', 'es', 'fr', 'it', 'de'];

export async function POST(request) {
  const deny = await requireAdmin(request);
  if (deny) return deny;

  try {
    const { photoId } = await request.json();
    if (!photoId) return NextResponse.json({ error: 'Missing photoId' }, { status: 400 });

    const supabase = createAdminClient();

    // Fetch the English source text from DB
    const { data: enRow, error } = await supabase
      .from('photo_translations')
      .select('title, description, alt_text, behind_lens, location')
      .eq('photo_id', photoId)
      .eq('locale', 'en')
      .single();

    if (error || !enRow?.title) {
      return NextResponse.json({ error: 'No English translation found for this photo — fill in English first.' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are a professional translator for a fine-art photography portfolio called DAVEJAVU.

Translate the following English photography metadata into Portuguese (pt), Spanish (es), French (fr), Italian (it), and German (de).
Preserve the tone — evocative, personal, artistic. Do not add or remove information.

English source:
- title: ${enRow.title}
- description: ${enRow.description || ''}
- alt_text: ${enRow.alt_text || ''}
- behind_lens: ${enRow.behind_lens || ''}
- location: ${enRow.location || ''}

Return ONLY a valid JSON object — no markdown, no preamble:
{
  "titles": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "descriptions": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "alt_text": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "behind_lens": { "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "location": ""
}

Rules:
- location: translate only city/country names if they have a local equivalent, otherwise keep as-is
- If a field is empty in English, return an empty string for all languages
- Titles: keep under 60 characters`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const data = JSON.parse(text);

    for (const locale of LOCALES) {
      const title = data.titles?.[locale];
      if (!title) continue;
      await supabase.from('photo_translations').upsert({
        photo_id: photoId,
        locale,
        title,
        description: data.descriptions?.[locale] || null,
        alt_text: data.alt_text?.[locale] || null,
        behind_lens: data.behind_lens?.[locale] || null,
        location: data.location || enRow.location || null,
      }, { onConflict: 'photo_id,locale', ignoreDuplicates: false });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('rerun-ai error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
