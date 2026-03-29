'use client';

import { useState, useEffect } from 'react';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function CollectionModal({ collection, onClose, onSuccess }) {
  const isEdit = !!collection;
  const enTrans = collection?.collection_translations?.find((t) => t.locale === 'en') || {};

  const [title, setTitle] = useState(enTrans.title || '');
  const [slug, setSlug] = useState(collection?.slug || '');
  const [description, setDescription] = useState(enTrans.description || '');
  const [published, setPublished] = useState(collection?.published ?? false);
  const [selectedIds, setSelectedIds] = useState(
    collection?.photo_collections?.map((pc) => pc.photo_id) || []
  );
  const [coverPhotoId, setCoverPhotoId] = useState(collection?.cover?.id || '');
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/photos').then((r) => r.json()).then((data) => {
      setPhotos(data.photos || []);
      setLoadingPhotos(false);
    });
  }, []);

  // Auto-generate slug from title when creating
  useEffect(() => {
    if (!isEdit) setSlug(slugify(title));
  }, [title, isEdit]);

  const togglePhoto = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (coverPhotoId === id) setCoverPhotoId('');
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const getTitle = (photo) =>
    photo.photo_translations?.find((t) => t.locale === 'en')?.title || '(untitled)';

  const effectiveCover = coverPhotoId || selectedIds[0] || null;

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!slug.trim()) { setError('Slug is required'); return; }
    setError('');
    setSaving(true);
    try {
      const url = isEdit ? `/api/collections/${collection.id}` : '/api/collections';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          published,
          coverPhotoId: effectiveCover,
          photoIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FAF9F6] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1d1d1] sticky top-0 bg-[#FAF9F6] z-10">
          <h2 className="text-sm font-700 uppercase tracking-widest text-charcoal">
            {isEdit ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal text-xl leading-none">×</button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-mid-gray mb-1.5">Title <span className="text-orange">*</span></label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ireland Coast"
              className="w-full px-3 py-2.5 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-mid-gray mb-1.5">Slug <span className="text-orange">*</span></label>
            <input
              type="text" value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="ireland-coast"
              className="w-full px-3 py-2.5 border border-[#d1d1d1] text-sm text-charcoal font-mono focus:outline-none focus:border-orange transition-colors"
            />
            <p className="text-[10px] text-mid-gray mt-1">/collections/{slug || '…'}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-mid-gray mb-1.5">Description</label>
            <textarea
              rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="A series captured along the rugged west coast of Ireland…"
              className="w-full px-3 py-2.5 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange transition-colors resize-none"
            />
          </div>

          {/* Published */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
              className="accent-orange w-4 h-4" />
            <span className="text-xs text-charcoal">Published (visible on site)</span>
          </label>

          {/* Photo picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest text-mid-gray">
                Photos <span className="text-charcoal">({selectedIds.length} selected)</span>
              </label>
              {selectedIds.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-mid-gray">Cover:</span>
                  <select
                    value={coverPhotoId}
                    onChange={(e) => setCoverPhotoId(e.target.value)}
                    className="text-xs border border-[#d1d1d1] px-2 py-1 text-charcoal focus:outline-none focus:border-orange"
                  >
                    <option value="">First selected</option>
                    {selectedIds.map((id) => {
                      const p = photos.find((x) => x.id === id);
                      return p ? <option key={id} value={id}>{getTitle(p)}</option> : null;
                    })}
                  </select>
                </div>
              )}
            </div>

            {loadingPhotos ? (
              <div className="py-8 text-center text-xs text-mid-gray uppercase tracking-widest">Loading photos…</div>
            ) : photos.length === 0 ? (
              <p className="text-xs text-mid-gray py-4 text-center">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto border border-[#d1d1d1] p-2 rounded">
                {photos.map((photo) => {
                  const selected = selectedIds.includes(photo.id);
                  const isCover = photo.id === effectiveCover;
                  return (
                    <button
                      key={photo.id} type="button" onClick={() => togglePhoto(photo.id)}
                      className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                        selected ? 'border-orange' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`https://res.cloudinary.com/${CLOUD}/image/upload/w_120,h_120,c_fill,q_60/${photo.cloudinary_id}.jpg`}
                        alt={getTitle(photo)}
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                      {selected && (
                        <div className="absolute inset-0 bg-orange/20 flex items-end justify-end p-1">
                          <span className="bg-orange text-white text-[8px] font-700 px-1 py-px rounded leading-none">
                            {isCover ? 'Cover' : '✓'}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave} disabled={saving}
              className="flex-1 py-3 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Collection'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-[#d1d1d1] text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
