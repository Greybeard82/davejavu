'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';

export default function AdminMoods() {
  const router = useRouter();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingMood, setEditingMood] = useState(null); // { original, value }
  const [saving, setSaving] = useState(null);

  const fetchMoods = async () => {
    setLoading(true);
    const res = await fetch('/api/moods');
    const data = await res.json();
    setMoods(data.moods || []);
    setLoading(false);
  };

  useEffect(() => { fetchMoods(); }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/en');
  };

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName('');
    setAdding(false);
    fetchMoods();
  };

  const rename = async (original, newValue) => {
    if (!newValue.trim() || newValue.trim() === original) { setEditingMood(null); return; }
    setSaving(original);
    await fetch(`/api/moods/${encodeURIComponent(original)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName: newValue.trim() }),
    });
    setSaving(null);
    setEditingMood(null);
    fetchMoods();
  };

  const deleteMood = async (name) => {
    if (!confirm(`Delete "${name}"? Photos tagged with this mood will lose it.`)) return;
    setSaving(name);
    await fetch(`/api/moods/${encodeURIComponent(name)}`, { method: 'DELETE' });
    setSaving(null);
    fetchMoods();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-[#d1d1d1] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="DAVEJAVU" width={60} height={30} className="object-contain" />
          <span className="text-[11px] uppercase tracking-widest text-mid-gray hidden sm:inline">Admin</span>
        </div>
        <nav className="flex items-center gap-4 md:gap-6 overflow-x-auto">
          <a href="/admin/dashboard" className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors shrink-0">Photos</a>
          <a href="/admin/collections" className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors shrink-0">Collections</a>
          <a href="/admin/moods" className="text-xs uppercase tracking-widest text-orange shrink-0">Moods</a>
          <a href="/admin/messages" className="text-xs uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors shrink-0">Messages</a>
          <button onClick={handleSignOut} className="text-xs uppercase tracking-widest text-mid-gray hover:text-red-500 transition-colors shrink-0">Sign out</button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-700 text-charcoal">Moods</h1>
          <p className="text-xs text-mid-gray mt-1 uppercase tracking-widest">{moods.length} mood{moods.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Add new */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="New mood name…"
            className="flex-1 px-4 py-2 border border-[#d1d1d1] text-sm text-charcoal focus:outline-none focus:border-orange"
          />
          <button
            onClick={add}
            disabled={adding || !newName.trim()}
            className="px-5 py-2 bg-orange text-white text-xs uppercase tracking-[2px] font-600 hover:bg-orange-dark transition-colors disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        {/* Moods list */}
        {loading ? (
          <p className="text-xs text-mid-gray uppercase tracking-widest py-12 text-center">Loading…</p>
        ) : (
          <div className="flex flex-col divide-y divide-[#d1d1d1] border border-[#d1d1d1]">
            {moods.map((mood) => (
              <div key={mood} className="flex items-center gap-3 px-4 py-3">
                {editingMood?.original === mood ? (
                  <input
                    autoFocus
                    className="flex-1 px-2 py-1 border border-orange text-sm text-charcoal focus:outline-none"
                    value={editingMood.value}
                    onChange={(e) => setEditingMood({ ...editingMood, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') rename(mood, editingMood.value);
                      if (e.key === 'Escape') setEditingMood(null);
                    }}
                    onBlur={() => rename(mood, editingMood.value)}
                  />
                ) : (
                  <span className="flex-1 text-sm text-charcoal">{mood}</span>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {editingMood?.original === mood ? (
                    <button
                      onClick={() => rename(mood, editingMood.value)}
                      disabled={saving === mood}
                      className="text-[10px] uppercase tracking-widest text-orange hover:underline disabled:opacity-50"
                    >
                      {saving === mood ? 'Saving…' : 'Save'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingMood({ original: mood, value: mood })}
                      className="text-[10px] uppercase tracking-widest text-mid-gray hover:text-charcoal transition-colors"
                    >
                      Rename
                    </button>
                  )}
                  <button
                    onClick={() => deleteMood(mood)}
                    disabled={saving === mood}
                    className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
