'use client';

import { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const SUBJECTS = [
  { value: 'Personal License', label: 'Personal License' },
  { value: 'Extended Personal License', label: 'Extended Personal License' },
  { value: 'Commercial License', label: 'Commercial License' },
  { value: 'Other', label: 'Other' },
];

const inputClass = 'w-full px-4 py-3 border border-[#d1d1d1] bg-white text-sm text-charcoal placeholder:text-mid-gray focus:outline-none focus:border-orange transition-colors';
const labelClass = 'block text-[10px] uppercase tracking-widest text-mid-gray mb-1.5';

function initSelectedPhotos(prefilledPhoto) {
  if (prefilledPhoto) return [{ id: 'prefilled', title: prefilledPhoto, image: null }];
  try {
    const favs = JSON.parse(localStorage.getItem('davejavu_favorites') || '[]');
    return favs.map((f) => ({ id: f.id, title: f.title, image: f.image }));
  } catch { return []; }
}

export default function ContactForm({ locale, prefilledPhoto = '' }) {
  const [fields, setFields] = useState({
    name: '', email: '', subject: 'Personal License', intendedUse: '', message: '', gdpr: false,
  });
  const [selectedPhotos, setSelectedPhotos] = useState(() => initSelectedPhotos(prefilledPhoto));
  const [manualInput, setManualInput] = useState('');
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const captchaRef = useRef(null);

  const set = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const removePhoto = (id) => setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));

  const addManualPhoto = () => {
    const title = manualInput.trim();
    if (!title) return;
    setSelectedPhotos((prev) => [...prev, { id: `manual-${Date.now()}`, title, image: null }]);
    setManualInput('');
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) e.name = 'Name is required';
    if (!fields.email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      e.email = 'Please enter a valid email address';
    }
    if (!fields.message.trim()) {
      e.message = 'Message is required';
    } else if (fields.message.trim().length < 20) {
      e.message = 'Message must be at least 20 characters';
    }
    if (!fields.gdpr) e.gdpr = 'You must agree to the data processing terms';
    if (!captchaToken) e.captcha = 'Please complete the captcha';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          subject: fields.subject,
          photosInterest: selectedPhotos.map((p) => p.title).join(', '),
          intendedUse: fields.intendedUse.trim(),
          message: fields.message.trim(),
          locale,
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[#f4f3ef] flex items-center justify-center mx-auto mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F07E2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-700 text-charcoal tracking-tight">Message sent</h2>
        <p className="text-sm text-mid-gray mt-2 leading-relaxed max-w-sm mx-auto">
          Thank you for your inquiry. I'll be in touch within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Your name <span className="text-orange">*</span></label>
          <input type="text" value={fields.name} onChange={(e) => set('name', e.target.value)}
            placeholder="David" className={inputClass} autoComplete="name" />
          {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass}>Email address <span className="text-orange">*</span></label>
          <input type="email" value={fields.email} onChange={(e) => set('email', e.target.value)}
            placeholder="you@email.com" className={inputClass} autoComplete="email" />
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className={labelClass}>Subject</label>
        <select value={fields.subject} onChange={(e) => set('subject', e.target.value)} className={inputClass}>
          {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Photos of interest */}
      <div>
        <label className={labelClass}>Photos of interest</label>

        {/* Selected photos list */}
        {selectedPhotos.length > 0 && (
          <div className="border border-[#d1d1d1] divide-y divide-[#d1d1d1] mb-2">
            {selectedPhotos.map((photo) => (
              <div key={photo.id} className="flex items-center gap-3 px-3 py-2">
                {photo.image ? (
                  <img src={photo.image} alt={photo.title}
                    className="w-14 h-10 object-cover rounded shrink-0" draggable="false" />
                ) : (
                  <div className="w-14 h-10 bg-[#f4f3ef] rounded shrink-0 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mid-gray">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <span className="text-sm text-charcoal flex-1 leading-snug">{photo.title}</span>
                <button type="button" onClick={() => removePhoto(photo.id)}
                  className="text-mid-gray hover:text-red-400 transition-colors text-lg leading-none px-1"
                  aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Add manually */}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualPhoto(); } }}
            placeholder={selectedPhotos.length === 0 ? "Photo title(s) you're interested in" : 'Add another photo…'}
            className={inputClass}
          />
          {manualInput.trim() && (
            <button type="button" onClick={addManualPhoto}
              className="shrink-0 px-4 border border-[#d1d1d1] text-xs uppercase tracking-widest text-charcoal hover:border-orange hover:text-orange transition-colors">
              Add
            </button>
          )}
        </div>
      </div>

      {/* Intended use */}
      <div>
        <label className={labelClass}>Intended use</label>
        <input type="text" value={fields.intendedUse} onChange={(e) => set('intendedUse', e.target.value)}
          placeholder="How do you plan to use the image?" className={inputClass} />
      </div>

      {/* Message */}
      <div>
        <label className={labelClass}>Message <span className="text-orange">*</span></label>
        <textarea rows={5} value={fields.message} onChange={(e) => set('message', e.target.value)}
          placeholder="Tell me more about your project..." className={`${inputClass} resize-none`} />
        {errors.message && <p className="text-[11px] text-red-500 mt-1">{errors.message}</p>}
      </div>

      {/* GDPR */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={fields.gdpr} onChange={(e) => set('gdpr', e.target.checked)}
            className="mt-0.5 accent-orange w-4 h-4 shrink-0" />
          <span className="text-xs text-mid-gray leading-relaxed">
            I agree to my data being stored to process this inquiry
          </span>
        </label>
        {errors.gdpr && <p className="text-[11px] text-red-500 mt-1">{errors.gdpr}</p>}
      </div>

      {/* hCaptcha */}
      <div>
        <HCaptcha ref={captchaRef} sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
          onVerify={(token) => { setCaptchaToken(token); setErrors((prev) => ({ ...prev, captcha: '' })); }}
          onExpire={() => setCaptchaToken('')} />
        {errors.captcha && <p className="text-[11px] text-red-500 mt-1">{errors.captcha}</p>}
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-4 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors disabled:opacity-50">
        {submitting ? 'Sending…' : 'Send inquiry'}
      </button>

    </form>
  );
}
