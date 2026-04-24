import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-guard';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(request, { params }) {
  const deny = await requireAdmin(request);
  if (deny) return deny;
  const { id } = await params;
  const body = await request.json();
  const allowed = ['read', 'replied'];
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('messages').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const deny = await requireAdmin(request);
  if (deny) return deny;
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(request, { params }) {
  const deny = await requireAdmin(request);
  if (deny) return deny;
  const { id } = await params;
  const { replyText, toEmail, toName, originalSubject } = await request.json();
  if (!replyText?.trim()) return NextResponse.json({ error: 'Reply text required' }, { status: 400 });

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: toEmail,
    replyTo: 'contact@davejavuphoto.com',
    subject: `Re: ${originalSubject || 'Your inquiry — DAVEJAVU'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:32px 0">
        <p style="white-space:pre-wrap;font-size:14px;line-height:1.8">${replyText.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <hr style="border:none;border-top:1px solid #d1d1d1;margin:32px 0">
        <p style="color:#aaa;font-size:12px">DAVEJAVU · davejavuphoto.com</p>
      </div>
    `,
  });
  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 });

  const supabase = createAdminClient();
  await supabase.from('messages').update({ replied: true }).eq('id', id);

  return NextResponse.json({ ok: true });
}
