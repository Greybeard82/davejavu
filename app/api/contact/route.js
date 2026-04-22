import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

async function verifyHcaptcha(token) {
  const res = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.HCAPTCHA_SECRET_KEY,
      response: token,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, photosInterest, intendedUse, message, locale, captchaToken } = body;

    // Server-side validation
    if (!name?.trim())
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    if (!message?.trim() || message.trim().length < 20)
      return NextResponse.json({ error: 'Message must be at least 20 characters' }, { status: 400 });
    if (!captchaToken)
      return NextResponse.json({ error: 'Captcha required' }, { status: 400 });

    // Verify hCaptcha
    const captchaOk = await verifyHcaptcha(captchaToken);
    if (!captchaOk)
      return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });

    // Store in Supabase
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject || null,
      photos_interest: photosInterest?.trim() || null,
      intended_use: intendedUse?.trim() || null,
      message: message.trim(),
      locale: locale || 'en',
    });
    if (dbError) console.error('DB insert error:', dbError.message);

    // Send email notification to admin
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'contact@davejavuphoto.com',
      replyTo: email.trim(),
      subject: `New inquiry: ${subject || 'General'} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#36454F">
          <h2 style="font-size:20px;margin-bottom:4px">New inquiry from ${name}</h2>
          <p style="color:#8a8a8a;font-size:13px;margin-top:0">${new Date().toUTCString()}</p>
          <hr style="border:none;border-top:1px solid #d1d1d1;margin:20px 0">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="color:#8a8a8a;padding:6px 12px 6px 0;width:140px">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="color:#8a8a8a;padding:6px 12px 6px 0">Subject</td><td>${subject || '—'}</td></tr>
            <tr><td style="color:#8a8a8a;padding:6px 12px 6px 0">Photos</td><td>${photosInterest || '—'}</td></tr>
            <tr><td style="color:#8a8a8a;padding:6px 12px 6px 0">Intended use</td><td>${intendedUse || '—'}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #d1d1d1;margin:20px 0">
          <p style="font-size:14px;line-height:1.7;white-space:pre-wrap">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border:none;border-top:1px solid #d1d1d1;margin:20px 0">
          <p style="color:#8a8a8a;font-size:11px">DAVEJAVU contact form · locale: ${locale || 'en'}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
