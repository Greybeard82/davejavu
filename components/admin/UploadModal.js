'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MOODS as MOODS_FALLBACK } from '@/lib/moods';

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];

// Resize image to max 1920px on longest side and re-encode as JPEG before upload.
// Keeps file well under Cloudinary's free-plan 10 MB limit regardless of source size.
async function compressForUpload(file, maxPx = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => blob ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })) : reject(new Error('Canvas compression failed')),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}
const LOCALE_LABELS = { en: 'English', pt: 'Português', es: 'Español', fr: 'Français', it: 'Italiano', de: 'Deutsch' };

const emptyTranslation = () => ({ title: '', description: '', alt_text: '', behind_lens: '', location: '' });
const initialTranslations = () => Object.fromEntries(LOCALES.map(l => [l, emptyTranslation()]));
const emptyCamera = () => ({ camera_body: '', lens: '', focal_length: '', aperture: '', iso: '', shutter_speed: '' });

function newItem(file) {
  return {
    id: Math.random().toString(36).slice(2),
    file,
    status: 'queued', // queued | uploading | suggesting | ready | saving | saved | error
    error: null,
    uploadResult: null,
    translations: initialTranslations(),
    moods: [],
    camera: emptyCamera(),

    availableForLicense: true,
    featured: false,
    published: false,
    collectionIds: [],
  };
}

const STATUS_LABEL = {
  queued: 'Queued',
  uploading: 'Uploading…',
  suggesting: 'AI analysing…',
  ready: 'Ready to review',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Error',
};

const STATUS_COLOR = {
  queued: 'text-mid-gray',
  uploading: 'text-orange',
  suggesting: 'text-orange',
  ready: 'text-blue-500',
  saving: 'text-orange',
  saved: 'text-green-600',
  error: 'text-red-500',
};

export default function UploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('select'); // select | review | done
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [activeLocale, setActiveLocale] = useState('en');
  const [useAI, setUseAI] = useState(true);
  const [collections, setCollections] = useState([]);
  const [moods, setMoods] = useState(MOODS_FALLBACK);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/moods').then(r => r.json()).then(d => { if (d.moods?.length) setMoods(d.moods); }).catch(() => {});
  }, []);

  // ── Fetch collections on mount ────────────────────────────────
  useEffect(() => {
    fetch('/api/collections')
      .then(r => r.json())
      .then(data => setCollections(data.collections || []));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  const updateItem = useCallback((id, patch) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const updateTranslation = (id, locale, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, translations: { ...item.translations, [locale]: { ...item.translations[locale], [field]: value } } };
    }));
  };

  const toggleMood = (id, mood) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const moods = item.moods.includes(mood) ? item.moods.filter(m => m !== mood) : [...item.moods, mood];
      return { ...item, moods };
    }));
  };

  const updateCamera = (id, key, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, camera: { ...item.camera, [key]: value } };
    }));
  };

  // ── File selection ────────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const valid = Array.from(fileList).filter(f =>
      ['image/jpeg', 'image/png', 'image/tiff', 'image/heic', 'image/heif'].includes(f.type) && f.size <= 50 * 1024 * 1024
    );
    if (valid.length === 0) return;
    setItems(prev => [...prev, ...valid.map(newItem)]);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeItem = (id) => setItems(prev => prev.filter(item => item.id !== id));

  // ── Upload + AI pipeline ──────────────────────────────────────
  const processItem = async (item) => {
    // 1. Get upload credentials from server
    updateItem(item.id, { status: 'uploading', error: null });
    let uploadResult;
    try {
      // 1a. Init — get Cloudinary signature + Supabase signed URL
      const initRes = await fetch('/api/upload-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: item.file.name, contentType: item.file.type, size: item.file.size }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Failed to initialise upload');

      const { photoId, storagePath, supabaseUploadUrl, cloudinary: cld } = initData;

      // 1b. Read true dimensions from the original file before compressing
      const originalDims = await new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(item.file);
        img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      });

      // 1c. Compress to ≤1920px JPEG so it fits within Cloudinary's free-plan 10 MB limit
      const compressed = await compressForUpload(item.file);

      // 1d. Upload display copy directly to Cloudinary from the browser
      const cldForm = new FormData();
      cldForm.append('file', compressed);
      cldForm.append('api_key', cld.apiKey);
      cldForm.append('timestamp', String(cld.timestamp));
      cldForm.append('signature', cld.signature);
      cldForm.append('public_id', cld.publicId);
      cldForm.append('transformation', cld.transformation);

      const cldRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cld.cloudName}/image/upload`,
        { method: 'POST', body: cldForm },
      );
      const cldData = await cldRes.json();
      if (!cldRes.ok) throw new Error(cldData.error?.message || 'Cloudinary upload failed');

      // 1e. Upload original master copy directly to Supabase Storage from the browser
      const storageRes = await fetch(supabaseUploadUrl, {
        method: 'PUT',
        body: item.file,
        headers: { 'Content-Type': item.file.type },
      });
      if (!storageRes.ok) throw new Error('Master storage upload failed');

      uploadResult = {
        photoId,
        cloudinaryId: cldData.public_id,
        storagePath,
        displayUrl: cldData.secure_url,
        tags: cldData.tags || [],
        width: originalDims?.width || cldData.width,
        height: originalDims?.height || cldData.height,
      };
      updateItem(item.id, { uploadResult });
    } catch (err) {
      updateItem(item.id, { status: 'error', error: err.message });
      return;
    }

    // 2. AI suggest (only if opted in)
    if (useAI) {
      updateItem(item.id, { status: 'suggesting' });
      try {
        const res = await fetch('/api/seo-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: uploadResult.displayUrl, tags: uploadResult.tags }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI suggestion failed');

        const translations = initialTranslations();
        LOCALES.forEach(l => {
          translations[l] = {
            ...translations[l],
            title: data.titles?.[l] || '',
            description: data.descriptions?.[l] || '',
            alt_text: data.alt_text?.[l] || '',
            location: data.location || '',
          };
        });

        const moods = (data.suggested_moods || []).filter(m => MOODS_FALLBACK.includes(m));
        updateItem(item.id, { status: 'ready', translations, moods });
      } catch (err) {
        // AI failed — still mark ready so admin can fill manually
        updateItem(item.id, { status: 'ready', error: `AI suggestion failed: ${err.message}` });
      }
    } else {
      updateItem(item.id, { status: 'ready' });
    }
  };

  const startProcessing = async () => {
    setProcessing(true);
    setStep('review');
    // Process all items sequentially
    for (const item of items) {
      await processItem(item);
    }
    setProcessing(false);
    setReviewIndex(0);
  };

  // ── Save ──────────────────────────────────────────────────────
  const saveItem = async (item) => {
    if (!item.translations.en.title.trim()) return { error: 'English title is required.' };
    updateItem(item.id, { status: 'saving' });
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: item.uploadResult.photoId,
          cloudinaryId: item.uploadResult.cloudinaryId,
          storagePath: item.uploadResult.storagePath,
          width: item.uploadResult.width,
          height: item.uploadResult.height,
          translations: item.translations,
          moods: item.moods,
          camera: item.camera,
          availableForLicense: item.availableForLicense,
          featured: item.featured,
          published: item.published,
          collectionIds: item.collectionIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      updateItem(item.id, { status: 'saved' });
      onSuccess?.();
      return {};
    } catch (err) {
      updateItem(item.id, { status: 'ready', error: err.message });
      return { error: err.message };
    }
  };

  const handleSaveAndNext = async () => {
    const item = items[reviewIndex];
    const { error } = await saveItem(item);
    if (error) return;

    const nextIndex = items.findIndex((it, i) => i > reviewIndex && it.status !== 'saved');
    if (nextIndex === -1) {
      setStep('done');
    } else {
      setReviewIndex(nextIndex);
      setActiveLocale('en');
    }
  };

  const handleSkip = () => {
    const nextIndex = items.findIndex((it, i) => i > reviewIndex && it.status !== 'saved');
    if (nextIndex === -1) {
      setStep('done');
    } else {
      setReviewIndex(nextIndex);
      setActiveLocale('en');
    }
  };

  // ── Derived ───────────────────────────────────────────────────
  const savedCount = items.filter(i => i.status === 'saved').length;
  const readyCount = items.filter(i => i.status === 'ready').length;
  const allProcessed = items.length > 0 && items.every(i => ['ready', 'saved', 'error'].includes(i.status));
  const currentItem = items[reviewIndex];

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FAF9F6] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1d1d1] sticky top-0 bg-[#FAF9F6] z-10">
          <h2 className="text-sm font-700 uppercase tracking-widest text-charcoal">
            {step === 'select' && 'Upload Photos'}
            {step === 'review' && `Review Photo ${reviewIndex + 1} of ${items.length}`}
            {step === 'done' && 'All Done'}
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal text-xl leading-none">×</button>
        </div>

        {/* ── STEP: Select ── */}
        {step === 'select' && (
          <div className="p-6 flex flex-col gap-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded cursor-pointer flex flex-col items-center justify-center py-14 gap-3 transition-colors ${
                dragging ? 'border-orange bg-orange/5' : 'border-[#d1d1d1] hover:border-orange'
              }`}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-mid-gray">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-600 text-charcoal">Drop photos here</p>
                <p className="text-xs text-mid-gray mt-1">or click to browse — JPG, PNG, TIFF, HEIC · max 50MB each</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.tiff,.tif,.heic,.heif" multiple className="hidden" onChange={e => addFiles(e.target.files)} />

            {/* File queue */}
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border border-[#d1d1d1] rounded bg-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mid-gray shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p className="text-xs text-charcoal flex-1 truncate">{item.file.name}</p>
                    <p className="text-[10px] text-mid-gray shrink-0">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <button onClick={() => removeItem(item.id)} className="text-mid-gray hover:text-red-500 transition-colors shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 p-3 border border-[#d1d1d1] rounded cursor-pointer hover:border-orange transition-colors">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={e => setUseAI(e.target.checked)}
                    className="accent-orange w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-600 text-charcoal">Auto-fill metadata with AI</p>
                    <p className="text-[10px] text-mid-gray mt-0.5">Claude Vision will analyse each photo and suggest titles, descriptions and alt text in all 6 languages. Uses API tokens — leave unchecked to fill manually.</p>
                  </div>
                </label>
                <button
                  onClick={startProcessing}
                  className="w-full py-3 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors"
                >
                  Upload {items.length} Photo{items.length !== 1 ? 's' : ''}
                  {useAI ? ' + Auto-fill with AI' : ''}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Review ── */}
        {step === 'review' && (
          <div className="p-6 flex flex-col gap-5">

            {/* Progress bar */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-1.5">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    title={`${item.file.name} — ${STATUS_LABEL[item.status]}`}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      item.status === 'saved' ? 'bg-green-500' :
                      item.status === 'error' ? 'bg-red-400' :
                      i === reviewIndex ? 'bg-orange' :
                      ['uploading', 'suggesting'].includes(item.status) ? 'bg-orange/40' :
                      'bg-[#d1d1d1]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                {items.map((item, i) => (
                  <span key={item.id} className={`text-[10px] uppercase tracking-wider font-600 ${i === reviewIndex ? 'text-charcoal' : STATUS_COLOR[item.status]}`}>
                    {i + 1}. {item.status === 'error' ? item.error?.slice(0, 30) : STATUS_LABEL[item.status]}
                  </span>
                ))}
              </div>
            </div>

            {/* Current item */}
            {currentItem && (
              <>
                {/* Preview */}
                <div className="flex gap-4 items-start">
                  {currentItem.uploadResult ? (
                    <img
                      src={currentItem.uploadResult.displayUrl}
                      alt="Preview"
                      className="w-28 h-28 object-cover rounded border border-[#d1d1d1] shrink-0"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded border border-[#d1d1d1] shrink-0 bg-[#f4f3ef] flex items-center justify-center">
                      {['uploading', 'suggesting'].includes(currentItem.status) ? (
                        <svg className="animate-spin text-orange" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#d1d1d1]">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-mid-gray truncate">{currentItem.file.name}</p>
                    <p className={`text-xs font-600 mt-1 ${STATUS_COLOR[currentItem.status]}`}>
                      {STATUS_LABEL[currentItem.status]}
                    </p>
                    {currentItem.error && <p className="text-[10px] text-red-500 mt-1">{currentItem.error}</p>}
                  </div>
                </div>

                {/* Only show form when ready */}
                {currentItem.status === 'ready' && (
                  <>
                    {/* Language tabs */}
                    <div>
                      <div className="flex gap-0 border-b border-[#d1d1d1] mb-4 overflow-x-auto">
                        {LOCALES.map(l => (
                          <button
                            key={l}
                            onClick={() => setActiveLocale(l)}
                            className={`px-4 py-3 text-[11px] uppercase tracking-widest font-600 border-b-2 -mb-px transition-colors shrink-0 ${
                              activeLocale === l ? 'border-orange text-orange' : 'border-transparent text-mid-gray hover:text-charcoal'
                            }`}
                          >
                            {l.toUpperCase()}
                            {l === 'en' && <span className="ml-1 text-red-400">*</span>}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3">
                        {[
                          { field: 'title', label: 'Title', required: activeLocale === 'en' },
                          { field: 'location', label: 'Location (city, country)' },
                          { field: 'description', label: 'Description', multiline: true },
                          { field: 'alt_text', label: 'Alt text' },
                          { field: 'behind_lens', label: 'Behind the lens', multiline: true },
                        ].map(({ field, label, required, multiline }) => (
                          <div key={field}>
                            <label className="block text-[11px] uppercase tracking-widest text-mid-gray mb-1">
                              {label}{required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            {multiline ? (
                              <textarea
                                rows={3}
                                value={currentItem.translations[activeLocale][field]}
                                onChange={e => updateTranslation(currentItem.id, activeLocale, field, e.target.value)}
                                className="w-full px-3 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange resize-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={currentItem.translations[activeLocale][field]}
                                onChange={e => updateTranslation(currentItem.id, activeLocale, field, e.target.value)}
                                className="w-full px-3 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mood tags */}
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-mid-gray mb-2">Mood tags</p>
                      <div className="flex flex-wrap gap-2">
                        {moods.map(mood => (
                          <button
                            key={mood}
                            onClick={() => toggleMood(currentItem.id, mood)}
                            className={`text-[10px] uppercase tracking-widest font-600 px-3 py-2 rounded-full border transition-all ${
                              currentItem.moods.includes(mood)
                                ? 'bg-orange border-orange text-white'
                                : 'border-[#d1d1d1] text-charcoal hover:border-orange hover:text-orange'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Camera metadata */}
                    <details className="group">
                      <summary className="text-[11px] uppercase tracking-widest text-mid-gray cursor-pointer select-none hover:text-charcoal transition-colors">
                        Camera metadata (optional)
                      </summary>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'camera_body', label: 'Camera body' },
                          { key: 'lens', label: 'Lens' },
                          { key: 'focal_length', label: 'Focal length' },
                          { key: 'aperture', label: 'Aperture' },
                          { key: 'iso', label: 'ISO', type: 'number' },
                          { key: 'shutter_speed', label: 'Shutter speed' },
                        ].map(({ key, label, type }) => (
                          <div key={key}>
                            <label className="block text-[11px] uppercase tracking-widest text-mid-gray mb-1">{label}</label>
                            <input
                              type={type || 'text'}
                              value={currentItem.camera[key]}
                              onChange={e => updateCamera(currentItem.id, key, e.target.value)}
                              className="w-full px-3 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange"
                            />
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Collections */}
                    {collections.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-mid-gray mb-2">Add to collections</p>
                        <div className="flex flex-wrap gap-2">
                          {collections.map(c => {
                            const title = c.collection_translations?.find(t => t.locale === 'en')?.title || c.slug;
                            const selected = currentItem.collectionIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => updateItem(currentItem.id, {
                                  collectionIds: selected
                                    ? currentItem.collectionIds.filter(id => id !== c.id)
                                    : [...currentItem.collectionIds, c.id],
                                })}
                                className={`text-[10px] uppercase tracking-widest font-600 px-3 py-2 rounded-full border transition-all ${
                                  selected
                                    ? 'bg-charcoal border-charcoal text-white'
                                    : 'border-[#d1d1d1] text-charcoal hover:border-charcoal'
                                }`}
                              >
                                {title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Toggles */}
                    <div className="pt-2 border-t border-[#d1d1d1]">
                      <div className="flex flex-col gap-3">
                        {[
                          { label: 'Available for license', field: 'availableForLicense' },
                          { label: 'Featured (hero carousel)', field: 'featured' },
                          { label: 'Published', field: 'published' },
                        ].map(({ label, field }) => (
                          <label key={field} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentItem[field]}
                              onChange={e => updateItem(currentItem.id, { [field]: e.target.checked })}
                              className="accent-orange w-4 h-4"
                            />
                            <span className="text-xs text-charcoal">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveAndNext}
                        className="flex-1 py-3 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors"
                      >
                        {reviewIndex === items.length - 1 ? 'Save & Finish' : 'Save & Next'}
                      </button>
                      <button
                        onClick={handleSkip}
                        className="px-6 py-3 border border-[#d1d1d1] text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </>
                )}

                {/* Waiting for upload/AI */}
                {['uploading', 'suggesting', 'queued'].includes(currentItem.status) && (
                  <div className="py-8 text-center text-xs text-mid-gray uppercase tracking-widest">
                    {currentItem.status === 'queued' && 'Waiting…'}
                    {currentItem.status === 'uploading' && 'Uploading photo…'}
                    {currentItem.status === 'suggesting' && 'Claude is analysing the photo…'}
                  </div>
                )}

                {/* Error state */}
                {currentItem.status === 'error' && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-red-500">{currentItem.error}</p>
                    <button
                      onClick={handleSkip}
                      className="px-6 py-3 border border-[#d1d1d1] text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors self-start"
                    >
                      Skip this photo
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── STEP: Done ── */}
        {step === 'done' && (
          <div className="p-12 flex flex-col items-center gap-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="font-700 text-charcoal text-lg">
                {savedCount} photo{savedCount !== 1 ? 's' : ''} saved
              </p>
              <p className="text-sm text-mid-gray mt-1">
                {items.filter(i => i.status === 'error').length > 0
                  ? `${items.filter(i => i.status === 'error').length} failed — check the dashboard for details.`
                  : 'All done — toggle Published when ready to go live.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('select'); setItems([]); setReviewIndex(0); setActiveLocale('en'); }}
                className="px-6 py-2.5 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors"
              >
                Upload more
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-[#d1d1d1] text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
