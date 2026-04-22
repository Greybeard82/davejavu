'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import UploadModal from '@/components/admin/UploadModal';
import { MOODS } from '@/lib/moods';

function MoodsModal({ photo, onClose, onSaved }) {
  const [selected, setSelected] = useState(
    () => (photo.photo_moods || []).map((m) => m.mood)
  );
  const [saving, setSaving] = useState(false);

  const toggle = (mood) =>
    setSelected((prev) => prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moods: selected }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-700 text-charcoal mb-1">Edit Moods</h3>
        <p className="text-[10px] text-mid-gray uppercase tracking-widest mb-4">{photo.photo_translations?.find(t => t.locale === 'en')?.title || 'Untitled'}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => toggle(mood)}
              className={`text-[10px] uppercase tracking-widest font-600 px-3 py-1.5 rounded-full border transition-all ${
                selected.includes(mood)
                  ? 'bg-orange border-orange text-white'
                  : 'border-[#d1d1d1] text-charcoal hover:border-orange hover:text-orange'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-[#d1d1d1] text-xs uppercase tracking-widest text-mid-gray hover:border-charcoal transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 bg-orange text-white text-xs uppercase tracking-widest font-600 hover:bg-orange-dark transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [moodsPhoto, setMoodsPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/photos');
      const data = await res.json();
      const list = data.photos || [];
      setPhotos(list);
      setStats({
        total: list.length,
        published: list.filter(p => p.published).length,
        drafts: list.filter(p => !p.published).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/en');
  };

  const toggleField = async (photoId, field, current) => {
    await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    fetchPhotos();
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    fetchPhotos();
  };

  const getTitle = (photo) => {
    const en = photo.photo_translations?.find(t => t.locale === 'en');
    return en?.title || '(untitled)';
  };

  const getLocation = (photo) => {
    const en = photo.photo_translations?.find(t => t.locale === 'en');
    return en?.location || '';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">


      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-700 text-charcoal">Photos</h1>
            <p className="text-xs text-mid-gray mt-1 uppercase tracking-widest">
              {stats.total} total · {stats.published} published · {stats.drafts} draft{stats.drafts !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-orange text-white text-xs uppercase tracking-[3px] font-600 px-6 py-3 hover:bg-orange-dark transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Upload Photo
          </button>
        </div>

        {/* Photo grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32 text-mid-gray text-xs uppercase tracking-widest">
            Loading…
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#d1d1d1]">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm text-mid-gray">No photos yet.</p>
            <button onClick={() => setShowUpload(true)} className="text-xs uppercase tracking-widest text-orange hover:underline">
              Upload your first photo →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="bg-white border border-[#d1d1d1] rounded overflow-hidden group">
                {/* Thumbnail via Cloudinary */}
                <div className="aspect-square bg-[#f4f3ef] relative overflow-hidden">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill,q_60/${photo.cloudinary_id}.jpg`}
                    alt={getTitle(photo)}
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card info */}
                <div className="p-3">
                  <p className="text-xs font-600 text-charcoal truncate">{getTitle(photo)}</p>
                  {getLocation(photo) && (
                    <p className="text-[10px] text-mid-gray mt-0.5 truncate">{getLocation(photo)}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Published toggle */}
                    <button
                      onClick={() => toggleField(photo.id, 'published', photo.published)}
                      className={`text-[9px] uppercase tracking-wider font-700 px-2 py-0.5 rounded ${
                        photo.published ? 'bg-green-100 text-green-700' : 'bg-[#f4f3ef] text-mid-gray'
                      }`}
                    >
                      {photo.published ? 'Published' : 'Draft'}
                    </button>
                    {/* Featured toggle */}
                    <button
                      onClick={() => toggleField(photo.id, 'featured', photo.featured)}
                      className={`text-[9px] uppercase tracking-wider font-700 px-2 py-0.5 rounded ${
                        photo.featured ? 'bg-orange/10 text-orange' : 'bg-[#f4f3ef] text-mid-gray'
                      }`}
                    >
                      {photo.featured ? '★ Featured' : 'Feature'}
                    </button>
                  </div>
                  {/* Moods */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[9px] text-mid-gray truncate">
                      {(photo.photo_moods || []).map(m => m.mood).join(', ') || 'No moods'}
                    </p>
                    <button
                      onClick={() => setMoodsPhoto(photo)}
                      className="text-[9px] uppercase tracking-wider text-orange hover:underline shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={fetchPhotos}
        />
      )}

      {moodsPhoto && (
        <MoodsModal
          photo={moodsPhoto}
          onClose={() => setMoodsPhoto(null)}
          onSaved={fetchPhotos}
        />
      )}
    </div>
  );
}
