'use client';

import { useState, useEffect, useRef } from 'react';
import { getFavorites, saveFavorites, FAV_KEY } from '@/lib/favorites';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslations } from 'next-intl';

const SUBJECT_KEYS = ['subjectPersonal', 'subjectCommercial', 'subjectOther'];

const inputClass = 'w-full px-4 py-3 border border-[#d1d1d1] bg-white text-sm text-charcoal placeholder:text-mid-gray focus:outline-none focus:border-orange transition-colors';
const labelClass = 'block text-[10px] uppercase tracking-widest text-mid-gray mb-1.5';

export default function ContactForm({ locale, prefilledPhoto = '' }) {
  const t = useTranslations('contact');
  const [fields, setFields] = useState({
    name: '', email: '', subject: 'Personal License', message: '', gdpr: false,
  });
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // Populate on mount: merge ?photo= param with saved favorites (deduped by title)
  useEffect(() => {
    try {
      const favs = getFavorites();
      const fromFavs = favs.map((f) => ({ id: f.id, title: f.title, image: f.image }));
      if (prefilledPhoto) {
        const alreadyInFavs = fromFavs.some((f) => f.title === prefilledPhoto);
        const prefilled = alreadyInFavs ? [] : [{ id: 'prefilled', title: prefilledPhoto, image: null }];
        setSelectedPhotos([...prefilled, ...fromFavs]);
      } else {
        setSelectedPhotos(fromFavs);
      }
    } catch { /* localStorage unavailable */ }
  }, [prefilledPhoto]);
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

  const removePhoto = (id) => {
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
    try {
      const favs = getFavorites();
      const updated = favs.filter((f) => f.id !== id);
      if (updated.length !== favs.length) saveFavorites(updated);
    } catch { /* ignore */ }
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) e.name = t('validation.nameRequired');
    if (!fields.email.trim()) {
      e.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      e.email = t('validation.emailInvalid');
    }
    if (!fields.message.trim()) {
      e.message = t('validation.messageRequired');
    } else if (fields.message.trim().length < 20) {
      e.message = t('validation.messageTooShort');
    }
    if (!fields.gdpr) e.gdpr = t('validation.gdprRequired');
    if (!captchaToken) e.captcha = t('validation.captchaRequired');
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
        <h2 className="text-xl font-700 text-charcoal tracking-tight">{t('successTitle')}</h2>
        <p className="text-sm text-mid-gray mt-2 leading-relaxed max-w-sm mx-auto">
          {t('successMessage')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>{t('name')} <span className="text-orange">*</span></label>
          <input type="text" value={fields.name} onChange={(e) => set('name', e.target.value)}
            placeholder="John Doe" className={inputClass} autoComplete="name" />
          {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass}>{t('email')} <span className="text-orange">*</span></label>
          <input type="email" value={fields.email} onChange={(e) => set('email', e.target.value)}
            placeholder="you@email.com" className={inputClass} autoComplete="email" />
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className={labelClass}>{t('subject')}</label>
        <select value={fields.subject} onChange={(e) => set('subject', e.target.value)} className={inputClass}>
          {SUBJECT_KEYS.map((key) => <option key={key} value={t(key)}>{t(key)}</option>)}
        </select>
      </div>

      {/* Photos of interest */}
      <div>
        <label className={labelClass}>{t('photosInterest')}</label>

        {selectedPhotos.length > 0 ? (
          <div className="border border-[#d1d1d1] divide-y divide-[#d1d1d1]">
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
        ) : (
          <p className="text-xs text-mid-gray py-3">
            No photos selected — save photos from the gallery using the ♡ button and they'll appear here automatically.
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className={labelClass}>{t('message')} <span className="text-orange">*</span></label>
        <textarea rows={5} value={fields.message} onChange={(e) => set('message', e.target.value)}
          placeholder={t('messagePlaceholder')} className={`${inputClass} resize-none`} />
        {errors.message && <p className="text-[11px] text-red-500 mt-1">{errors.message}</p>}
      </div>

      {/* GDPR */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={fields.gdpr} onChange={(e) => set('gdpr', e.target.checked)}
            className="mt-0.5 accent-orange w-4 h-4 shrink-0" />
          <span className="text-xs text-mid-gray leading-relaxed">
            {t('gdpr')}
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
        {submitting ? t('sending') : t('submit')}
      </button>

    </form>
  );
}
