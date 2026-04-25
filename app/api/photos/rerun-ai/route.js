import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];
const MOODS = ['Golden Hour', 'Blue Hour', 'Storm', 'Solitude', 'Urban Chaos', 'Mist', 'Silence', 'Neon', 'Vast', 'Intimate'];

export async function POST(request) {
  const deny = await requireAdmin(request);
  if (deny) return deny;

  try {
    const { photoId, imageUrl } = await request.json();
    if (!photoId || !imageUrl) return NextResponse.json({ error: 'Missing photoId or imageUrl' }, { status: 400 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are an SEO assistant for a landscape and cityscape photography portfolio called DAVEJAVU.

Analyse this photo and return ONLY a valid JSON object — no markdown, no preamble, no trailing text. Structure:
{
  "titles": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "descriptions": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "alt_text": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "behind_lens": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "location": ""
}
Rules:
- Titles: evocative, emotional, under 60 characters, in each language
- Descriptions: SEO meta description, under 155 characters, in each language
- Alt text: descriptive for accessibility, in each language
- behind_lens: 2-3 sentences about the moment, light, or technique — personal and vivid, in each language
- location: "City, Country" if identifiable, otherwise empty string`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: prompt },
        ],
      }],
    });

    let text = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const data = JSON.parse(text);

    const supabase = createAdminClient();

    // Upsert translations for all locales
    for (const locale of LOCALES) {
      const title = data.titles?.[locale];
      const description = data.descriptions?.[locale];
      const alt_text = data.alt_text?.[locale];
      if (!title) continue;

      await supabase.from('photo_translations').upsert({
        photo_id: photoId,
        locale,
        title,
        description: description || null,
        alt_text: alt_text || null,
        behind_lens: data.behind_lens?.[locale] || null,
      }, { onConflict: 'photo_id,locale', ignoreDuplicates: false });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('rerun-ai error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
