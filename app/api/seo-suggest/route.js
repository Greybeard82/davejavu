import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const MOODS = ['Golden Hour', 'Blue Hour', 'Storm', 'Solitude', 'Urban Chaos', 'Mist', 'Silence', 'Neon', 'Vast', 'Intimate'];

export async function POST(request) {
  try {
    const { imageUrl, location, tags } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set in environment variables' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const tagContext = tags?.length > 0 ? `Cloudinary auto-tags: ${tags.join(', ')}.` : '';
    const locationContext = location?.trim() ? `Known location: ${location.trim()}.` : '';

    const prompt = `You are an SEO assistant for a landscape and cityscape photography portfolio called DAVEJAVU.
${tagContext}
${locationContext}

Analyse this photo and return ONLY a valid JSON object — no markdown, no preamble, no trailing text. Structure:
{
  "titles": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "descriptions": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "alt_text": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "location": "",
  "suggested_moods": []
}
Rules:
- Titles: evocative, emotional, under 60 characters, in each language
- Descriptions: SEO meta description, under 155 characters, in each language
- Alt text: descriptive for accessibility, in each language
- location: "City, Country" if identifiable, otherwise empty string
- suggested_moods: pick 1-3 from this list only: [${MOODS.join(', ')}]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    let text = response.content[0].text.trim();
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const json = JSON.parse(text);

    return NextResponse.json(json);
  } catch (err) {
    console.error('SEO suggest error:', err);
    return NextResponse.json({ error: err.message || 'AI suggestion failed' }, { status: 500 });
  }
}
