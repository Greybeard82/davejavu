'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import CollectionModal from '@/components/admin/CollectionModal';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | collection object

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data.collections || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/en');
  };

  const togglePublished = async (collection) => {
    await fetch(`/api/collections/${collection.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !collection.published }),
    });
    fetchCollections();
  };

  const deleteCollection = async (id) => {
    if (!confirm('Delete this collection? Photos will not be deleted.')) return;
    await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    fetchCollections();
  };

  const getTitle = (c) =>
    c.collection_translations?.find((t) => t.locale === 'en')?.title || '(untitled)';

  const getPhotoCount = (c) => c.photo_collections?.length || 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-[#d1d1d1] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="DAVEJAVU" width={60} height={30} className="object-contain" />
          <span className="text-[11px] uppercase tracking-widest text-mid-gray hidden sm:inline">Admin</span>
        </div>
        <nav className="flex items-center gap-4 md:gap-6 overflow-x-auto">
          <a href="/admin/dashboard" className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors shrink-0">Photos</a>
          <a href="/admin/collections" className="text-xs uppercase tracking-widest text-orange shrink-0">Collections</a>
          <a href="/admin/moods" className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors shrink-0">Moods</a>
          <a href="/admin/messages" className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors shrink-0">Messages</a>
          <button onClick={handleSignOut} className="text-xs uppercase tracking-widest text-mid-gray hover:text-red-500 transition-colors shrink-0">Sign out</button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-700 text-charcoal">Collections</h1>
            <p className="text-xs text-mid-gray mt-1 uppercase tracking-widest">
              {collections.length} total · {collections.filter((c) => c.published).length} published
            </p>
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 bg-orange text-white text-xs uppercase tracking-[3px] font-600 px-6 py-3 hover:bg-orange-dark transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Collection
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-mid-gray text-xs uppercase tracking-widest">Loading…</div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <p className="text-sm text-mid-gray">No collections yet.</p>
            <button onClick={() => setModal('create')} className="text-xs uppercase tracking-widest text-orange hover:underline">
              Create your first collection →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {collections.map((c) => (
              <div key={c.id} className="bg-white border border-[#d1d1d1] rounded flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4">
                {/* Cover thumbnail */}
                <div className="w-16 h-16 shrink-0 bg-[#f4f3ef] rounded overflow-hidden">
                  {c.cover?.cloudinary_id ? (
                    <img
                      src={`https://res.cloudinary.com/${CLOUD}/image/upload/w_120,h_120,c_fill,q_60/${c.cover.cloudinary_id}.jpg`}
                      alt={getTitle(c)}
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#d1d1d1]">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-charcoal">{getTitle(c)}</p>
                  <p className="text-[10px] text-mid-gray mt-0.5">
                    /collections/{c.slug} · {getPhotoCount(c)} photo{getPhotoCount(c) !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublished(c)}
                    className={`text-[9px] uppercase tracking-wider font-700 px-2 py-1 rounded transition-colors ${
                      c.published ? 'bg-green-100 text-green-700' : 'bg-[#f4f3ef] text-mid-gray hover:text-charcoal'
                    }`}
                  >
                    {c.published ? 'Published' : 'Draft'}
                  </button>
                  <button
                    onClick={() => setModal(c)}
                    className="text-[10px] uppercase tracking-widest px-2 py-1 border border-[#d1d1d1] rounded text-charcoal hover:border-orange hover:text-orange transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCollection(c.id)}
                    className="w-7 h-7 flex items-center justify-center text-mid-gray hover:text-red-500 transition-colors"
                    aria-label="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <CollectionModal
          collection={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={fetchCollections}
        />
      )}
    </div>
  );
}
