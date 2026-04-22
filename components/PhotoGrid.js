'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { decode } from 'blurhash';
import { MOODS as MOODS_FALLBACK } from '@/lib/moods';
import { getFavorites, saveFavorites } from '@/lib/favorites';
import { addToBasket, isInBasket } from '@/lib/basket';

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

function Lightbox({ photo, locale, onClose }) {
  const [favorited, setFavorited] = useState(() =>
    getFavorites().some((f) => f.id === photo.id)
  );
  const [inBasket, setInBasket] = useState(() => isInBasket(photo.id));

  const handleBasket = (e) => {
    e.stopPropagation();
    if (!inBasket) {
      addToBasket({ photoId: photo.id, title: photo.title, tier: 'web_small' });
      setInBasket(true);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleFavorite = (e) => {
    e.stopPropagation();
    const favs = getFavorites();
    const isFav = favs.some((f) => f.id === photo.id);
    const updated = isFav
      ? favs.filter((f) => f.id !== photo.id)
      : [...favs, { id: photo.id, title: photo.title, location: photo.location, image: photo.image }];
    saveFavorites(updated);
    setFavorited(!isFav);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Photo + action bar — inline-flex column so bar width matches photo width exactly */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="inline-flex flex-col">

          <motion.div layoutId={`photo-${photo.id}`}>
            <img
              src={photo.image}
              alt={photo.title}
              className="block"
              style={{ maxWidth: '95vw', maxHeight: 'calc(100vh - 100px)', objectFit: 'contain' }}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </motion.div>

          {/* Action bar — same width as rendered photo */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex items-center justify-between gap-4 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Caption — left */}
            <div>
              <h3 className="text-white font-700 text-base tracking-tight leading-tight">{photo.title}</h3>
              {photo.location && (
                <p className="text-white/55 text-[11px] uppercase tracking-[3px] mt-0.5">{photo.location}</p>
              )}
            </div>

            {/* Buttons — right */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                href={`/${locale}/photo/${photo.id}`}
                className="flex flex-col items-center gap-1 group"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 hover:scale-105">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">Details</span>
              </Link>

              <button
                onClick={toggleFavorite}
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${
                  favorited ? 'bg-white text-orange scale-110' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105'
                }`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">
                  {favorited ? 'Saved' : 'Save'}
                </span>
              </button>

              <button
                onClick={handleBasket}
                aria-label={inBasket ? 'In basket' : 'Add to basket'}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${
                  inBasket ? 'bg-orange text-white scale-110' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105'
                }`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">
                  {inBasket ? 'In basket' : 'Basket'}
                </span>
              </button>

            </div>
          </motion.div>

        </div>
      </div>

      {/* Close — top-right */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </motion.button>
    </motion.div>
  );
}

function PhotoCard({ photo, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const [errored, setErrored] = useState(false);
  const [favorited, setFavorited] = useState(() => getFavorites().some((f) => f.id === photo.id));

  const toggleFavorite = (e) => {
    e.stopPropagation();
    const favs = getFavorites();
    const isFav = favs.some((f) => f.id === photo.id);
    const updated = isFav
      ? favs.filter((f) => f.id !== photo.id)
      : [...favs, { id: photo.id, title: photo.title, location: photo.location, image: photo.image }];
    saveFavorites(updated);
    setFavorited(!isFav);
  };

  if (errored) return null;

  return (
    <div
      className="relative group mb-4 break-inside-avoid cursor-pointer rounded"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(photo)}
    >
      {/* layoutId is on this div — no overflow-hidden on the parent so animation isn't clipped */}
      <motion.div layoutId={`photo-${photo.id}`} className="relative overflow-hidden rounded">
        {/* BlurHash placeholder */}
        <BlurHashPlaceholder hash={photo.blurhash} />

        {/* Transparent overlay — blocks right-click / touch save */}
        <div className="photo-overlay absolute inset-0 z-10" />

        <img
          src={photo.image}
          alt={photo.title}
          onError={() => setErrored(true)}
          className={`relative w-full block transition-transform duration-700 ${hovered ? 'scale-105' : 'scale-100'}`}
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
        </div>

        {/* Top-right buttons */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5">
          <button
            onClick={toggleFavorite}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
              favorited
                ? 'bg-white text-orange'
                : 'bg-black/30 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </motion.div>

    </div>
  );
}

export default function PhotoGrid({ photos = [], locale, moods = MOODS_FALLBACK }) {
  const [activeFilters, setActiveFilters] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const toggleFilter = (mood) => {
    setActiveFilters((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const filtered = activeFilters.length === 0
    ? photos
    : photos.filter((p) => p.moods.some((m) => activeFilters.includes(m)));

  return (
    <>
      <section id="portfolio" className="max-w-[1800px] mx-auto px-6 py-20">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">Portfolio</h2>
            <p className="text-sm text-mid-gray mt-1 tracking-wide">{filtered.length} photo{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Mood filters */}
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
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
          <div className="columns-1 sm:columns-2 gap-4">
            {filtered.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} locale={locale} onSelect={setLightboxPhoto} />
            ))}
          </div>
        )}
      </section>

      {/* Lightbox — outside section so it renders above everything */}
      <AnimatePresence>
        {lightboxPhoto && (
          <Lightbox
            photo={lightboxPhoto}
            locale={locale}
            onClose={() => setLightboxPhoto(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
