import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const deny = await requireAdmin(request);
  if (deny) return deny;

  try {
    const { en } = await request.json();
    if (!en?.title?.trim()) return NextResponse.json({ error: 'English title is required' }, { status: 400 });

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
- location: translate only city/country names if they have a local equivalent, otherwise keep as-is
- If a field is empty in English, return an empty string for all languages
- Titles: keep under 60 characters`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error('translate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
