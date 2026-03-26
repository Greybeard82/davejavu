'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { decode } from 'blurhash';

function BlurHashPlaceholder({ hash }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!hash || !canvasRef.current) return;
    try {
      const pixels = decode(hash, 32, 32);
      const ctx = canvasRef.current.getContext('2d');
      const imageData = ctx.createImageData(32, 32);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    } catch {
      // Invalid hash — fallback handled by CSS background
    }
  }, [hash]);

  if (!hash) {
    return <div className="absolute inset-0 bg-[#e8e6e1]" />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

const MOODS = ['Golden Hour', 'Blue Hour', 'Storm', 'Solitude', 'Urban Chaos', 'Mist', 'Silence', 'Neon', 'Vast', 'Intimate'];

// Placeholder photos — replaced with real DB data once photos are uploaded
const PLACEHOLDER_PHOTOS = [
  { id: '1', image: 'https://picsum.photos/seed/dj-p1/800/1100', title: 'Into the Mist', location: 'Zhangjiajie, China', moods: ['Mist', 'Solitude'], isNew: true, licensed: true, tall: true },
  { id: '2', image: 'https://picsum.photos/seed/dj-p2/800/530', title: 'Golden Hour', location: 'Kyoto, Japan', moods: ['Golden Hour', 'Intimate'], isNew: true, licensed: true, tall: false },
  { id: '3', image: 'https://picsum.photos/seed/dj-p3/800/530', title: 'Neon Rain', location: 'Seoul, South Korea', moods: ['Neon', 'Urban Chaos'], isNew: false, licensed: true, tall: false },
  { id: '4', image: 'https://picsum.photos/seed/dj-p4/800/1100', title: 'River of Light', location: 'Hanoi, Vietnam', moods: ['Blue Hour', 'Urban Chaos'], isNew: false, licensed: true, tall: true },
  { id: '5', image: 'https://picsum.photos/seed/dj-p5/800/530', title: 'Vast', location: 'Banff, Canada', moods: ['Vast', 'Silence'], isNew: true, licensed: false, tall: false },
  { id: '6', image: 'https://picsum.photos/seed/dj-p6/800/530', title: 'Storm Over the Bay', location: 'Barcelona, Spain', moods: ['Storm', 'Vast'], isNew: false, licensed: true, tall: false },
  { id: '7', image: 'https://picsum.photos/seed/dj-p7/800/1100', title: 'Blue Hour', location: 'Tokyo, Japan', moods: ['Blue Hour', 'Neon'], isNew: false, licensed: true, tall: true },
  { id: '8', image: 'https://picsum.photos/seed/dj-p8/800/530', title: 'Solitude', location: 'Hokkaido, Japan', moods: ['Solitude', 'Silence'], isNew: true, licensed: true, tall: false },
  { id: '9', image: 'https://picsum.photos/seed/dj-p9/800/530', title: 'Morning Mist', location: 'Guilin, China', moods: ['Mist', 'Vast'], isNew: false, licensed: true, tall: false },
];

function PhotoCard({ photo, locale }) {
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative group mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/${locale}/photo/${photo.id}`}>
        <div className="relative overflow-hidden">
          {/* BlurHash placeholder — shown until image loads */}
          <BlurHashPlaceholder hash={photo.blurhash} />

          {/* Transparent overlay — blocks right-click / touch save */}
          <div className="photo-overlay absolute inset-0 z-10" />

          <img
            src={photo.image}
            alt={photo.title}
            onLoad={() => setLoaded(true)}
            className={`relative w-full object-cover transition-all duration-700 ${hovered ? 'scale-105' : 'scale-100'} ${loaded ? 'opacity-100' : 'opacity-0'}`}
            draggable="false"
          />

          {/* Hover overlay */}
          <div className={`absolute inset-0 z-20 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-white text-xs uppercase tracking-[3px] font-300 mb-1">{photo.location}</p>
            <h3 className="text-white text-lg font-700 leading-tight">{photo.title}</h3>
            <div className="flex flex-wrap gap-1 mt-2">
              {photo.moods.map((mood) => (
                <span key={mood} className="text-white/70 text-[10px] uppercase tracking-wider border border-white/30 px-2 py-0.5 rounded-full">
                  {mood}
                </span>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
            {photo.isNew && (
              <span className="bg-orange text-white text-[9px] font-700 uppercase tracking-wider px-2 py-0.5 rounded">
                New
              </span>
            )}
            {photo.licensed && (
              <span className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-400 uppercase tracking-wider px-2 py-0.5 rounded">
                License available
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function PhotoGrid({ photos = PLACEHOLDER_PHOTOS, locale }) {
  const [activeFilters, setActiveFilters] = useState([]);

  const toggleFilter = (mood) => {
    setActiveFilters((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const filtered = activeFilters.length === 0
    ? photos
    : photos.filter((p) => p.moods.some((m) => activeFilters.includes(m)));

  return (
    <section id="portfolio" className="max-w-7xl mx-auto px-6 py-20">
      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">Portfolio</h2>
          <p className="text-sm text-mid-gray mt-1 tracking-wide">{filtered.length} photo{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Mood filters */}
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => toggleFilter(mood)}
              className={`text-[10px] uppercase tracking-widest font-600 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                activeFilters.includes(mood)
                  ? 'bg-orange border-orange text-white'
                  : 'border-[#d1d1d1] text-charcoal hover:border-orange hover:text-orange'
              }`}
            >
              {mood}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              className="text-[10px] uppercase tracking-widest font-600 px-3 py-1.5 text-mid-gray hover:text-orange transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Masonry grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-mid-gray">
          <p className="text-sm uppercase tracking-widest">No photos match the selected filters.</p>
        </div>
      ) : (
        <div
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
        >
          {filtered.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
