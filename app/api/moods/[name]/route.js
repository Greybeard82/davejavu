import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function PATCH(request, { params }) {
  const { name } = await params;
  const { newName } = await request.json();
  if (!newName?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const supabase = createAdminClient();
  // Insert new name, update all photo_moods references, delete old
  const [{ error: insErr }, { error: moodErr }] = await Promise.all([
    supabase.from('moods').insert({ name: newName.trim() }),
    supabase.from('photo_moods').update({ mood: newName.trim() }).eq('mood', name),
  ]);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  if (moodErr) return NextResponse.json({ error: moodErr.message }, { status: 500 });
  await supabase.from('moods').delete().eq('name', name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  const { name } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from('moods').delete().eq('name', name);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
