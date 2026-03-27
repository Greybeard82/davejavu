'use client';

import { useState, useRef, useCallback } from 'react';

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];
const LOCALE_LABELS = { en: 'English', pt: 'Português', es: 'Español', fr: 'Français', it: 'Italiano', de: 'Deutsch' };
const MOODS = ['Golden Hour', 'Blue Hour', 'Storm', 'Solitude', 'Urban Chaos', 'Mist', 'Silence', 'Neon', 'Vast', 'Intimate'];

const emptyTranslation = () => ({ title: '', description: '', alt_text: '', behind_lens: '', location: '' });
const initialTranslations = () => Object.fromEntries(LOCALES.map(l => [l, emptyTranslation()]));

export default function UploadModal({ onClose, onSuccess }) {
  // Step: 'upload' | 'metadata' | 'success'
  const [step, setStep] = useState('upload');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Metadata form
  const [activeLocale, setActiveLocale] = useState('en');
  const [translations, setTranslations] = useState(initialTranslations);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [camera, setCamera] = useState({ camera_body: '', lens: '', focal_length: '', aperture: '', iso: '', shutter_speed: '' });
  const [editionMax, setEditionMax] = useState('');
  const [availableForLicense, setAvailableForLicense] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fileInputRef = useRef(null);

  // ── Upload step ──────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadResult(data);

      // Pre-select moods that match Cloudinary tags
      const tagLower = (data.tags || []).map(t => t.toLowerCase());
      const suggestedMoods = MOODS.filter(mood => {
        const m = mood.toLowerCase();
        return tagLower.some(t =>
          t.includes(m) ||
          (m === 'golden hour' && (t.includes('sunset') || t.includes('golden'))) ||
          (m === 'blue hour' && (t.includes('dusk') || t.includes('twilight'))) ||
          (m === 'mist' && (t.includes('fog') || t.includes('mist') || t.includes('haze'))) ||
          (m === 'vast' && (t.includes('mountain') || t.includes('landscape') || t.includes('horizon'))) ||
          (m === 'urban chaos' && (t.includes('city') || t.includes('urban') || t.includes('street'))) ||
          (m === 'neon' && (t.includes('neon') || t.includes('night') || t.includes('light')))
        );
      });
      setSelectedMoods(suggestedMoods);
      setStep('metadata');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  // ── Metadata helpers ─────────────────────────────────────────
  const updateTranslation = (locale, field, value) => {
    setTranslations(prev => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
  };

  const toggleMood = (mood) => {
    setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);
  };

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!translations.en.title.trim()) {
      setSaveError('English title is required.');
      return;
    }
    setSaveError('');
    setSaving(true);

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: uploadResult.photoId,
          cloudinaryId: uploadResult.cloudinaryId,
          storagePath: uploadResult.storagePath,
          translations,
          moods: selectedMoods,
          camera,
          editionMax: editionMax ? parseInt(editionMax) : null,
          availableForLicense,
          featured,
          published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setStep('success');
      onSuccess?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FAF9F6] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1d1d1]">
          <h2 className="text-sm font-700 uppercase tracking-widest text-charcoal">
            {step === 'upload' && 'Upload Photo'}
            {step === 'metadata' && 'Add Details'}
            {step === 'success' && 'Photo Saved'}
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal transition-colors text-xl leading-none">×</button>
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div className="p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded cursor-pointer flex flex-col items-center justify-center py-20 gap-4 transition-colors ${
                dragging ? 'border-orange bg-orange/5' : 'border-[#d1d1d1] hover:border-orange'
              }`}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-mid-gray">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-600 text-charcoal">Drop your photo here</p>
                <p className="text-xs text-mid-gray mt-1">or click to browse — JPG, PNG, TIFF, HEIC · max 50MB</p>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-orange text-xs font-600 uppercase tracking-widest">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Uploading…
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.tiff,.tif,.heic,.heif" className="hidden" onChange={onFileChange} />
            {uploadError && <p className="mt-4 text-sm text-red-600">{uploadError}</p>}
          </div>
        )}

        {/* ── STEP 2: Metadata ── */}
        {step === 'metadata' && uploadResult && (
          <div className="p-6 flex flex-col gap-6">

            {/* Preview + Cloudinary tags */}
            <div className="flex gap-4 items-start">
              <img
                src={uploadResult.displayUrl}
                alt="Preview"
                className="w-28 h-28 object-cover rounded border border-[#d1d1d1] shrink-0"
              />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-mid-gray mb-2">Cloudinary tags</p>
                {uploadResult.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {uploadResult.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-[#e8e6e1] text-charcoal px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-mid-gray italic">No tags returned (auto-tagging requires Cloudinary paid plan)</p>
                )}
              </div>
            </div>

            {/* Language tabs */}
            <div>
              <div className="flex gap-0 border-b border-[#d1d1d1] mb-4">
                {LOCALES.map(l => (
                  <button
                    key={l}
                    onClick={() => setActiveLocale(l)}
                    className={`px-4 py-2 text-[11px] uppercase tracking-widest font-600 border-b-2 -mb-px transition-colors ${
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
                        value={translations[activeLocale][field]}
                        onChange={e => updateTranslation(activeLocale, field, e.target.value)}
                        className="w-full px-3 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={translations[activeLocale][field]}
                        onChange={e => updateTranslation(activeLocale, field, e.target.value)}
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
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={`text-[10px] uppercase tracking-widest font-600 px-3 py-1.5 rounded-full border transition-all ${
                      selectedMoods.includes(mood)
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
              <div className="mt-3 grid grid-cols-2 gap-3">
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
                      value={camera[key]}
                      onChange={e => setCamera(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange"
                    />
                  </div>
                ))}
              </div>
            </details>

            {/* Edition + toggles */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#d1d1d1]">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-mid-gray mb-1">Edition size (blank = open edition)</label>
                <input
                  type="number"
                  min="1"
                  value={editionMax}
                  onChange={e => setEditionMax(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange"
                />
              </div>
              <div className="flex flex-col gap-3 justify-end">
                {[
                  { label: 'Available for license', state: availableForLicense, set: setAvailableForLicense },
                  { label: 'Featured (hero carousel)', state: featured, set: setFeatured },
                  { label: 'Published', state: published, set: setPublished },
                ].map(({ label, state, set }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={state} onChange={e => set(e.target.checked)}
                      className="accent-orange w-4 h-4" />
                    <span className="text-xs text-charcoal">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Photo'}
              </button>
              <button
                onClick={() => { setStep('upload'); setUploadResult(null); setTranslations(initialTranslations); setSelectedMoods([]); }}
                className="px-6 py-3 border border-[#d1d1d1] text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 'success' && (
          <div className="p-12 flex flex-col items-center gap-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="font-700 text-charcoal text-lg">Photo saved successfully</p>
              <p className="text-sm text-mid-gray mt-1">
                {published ? 'It is now visible on the site.' : 'It is saved as a draft — toggle Published when ready.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('upload'); setUploadResult(null); setTranslations(initialTranslations); setSelectedMoods([]); setCamera({ camera_body: '', lens: '', focal_length: '', aperture: '', iso: '', shutter_speed: '' }); setEditionMax(''); setPublished(false); setFeatured(false); setAvailableForLicense(true); }}
                className="px-6 py-2.5 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors"
              >
                Upload another
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
