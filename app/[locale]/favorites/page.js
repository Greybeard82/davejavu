'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getFavorites, saveFavorites, FAV_KEY } from '@/lib/favorites';
import { useTranslations } from 'next-intl';

export default function FavoritesPage({ params }) {
  const t = useTranslations('favorites');
  const { locale } = use(params);
  const [favorites, setFavorites] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setMounted(true);

    const onStorage = () => setFavorites(getFavorites());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const remove = (id) => {
    const updated = favorites.filter((f) => f.id !== id);
    saveFavorites(updated);
    setFavorites(updated);
  };

  const inquireAllHref = `/${locale}/contact?photo=${encodeURIComponent(
    favorites.map((f) => f.title).join(', ')
  )}`;

  if (!mounted) return null;

  return (
    <div className="max-w-[1800px] mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">{t('title')}</h1>
          <p className="text-sm text-mid-gray mt-1 tracking-wide">
            {t('count', { count: favorites.length })}
          </p>
        </div>
        {favorites.length > 0 && (
          <Link
            href={inquireAllHref}
            className="shrink-0 inline-block bg-orange text-white text-xs uppercase tracking-[3px] font-600 px-6 py-3 hover:bg-orange-dark transition-colors"
          >
            {t('inquireAll')}
          </Link>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-32">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#d1d1d1] mx-auto mb-6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p className="text-sm uppercase tracking-widest text-mid-gray mb-6">{t('empty')}</p>
          <Link
            href={`/${locale}`}
            className="text-xs uppercase tracking-widest text-charcoal hover:text-orange transition-colors border-b border-charcoal hover:border-orange pb-0.5"
          >
            {t('browseCta')}
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {favorites.map((photo) => (
            <div key={photo.id} className="relative group mb-4 break-inside-avoid">
              <Link href={`/${locale}/photo/${photo.id}`}>
                <div className="relative overflow-hidden rounded">
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="w-full block"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-xs uppercase tracking-[3px] mb-1">{photo.location}</p>
                    <h3 className="text-white text-base font-700 leading-tight">{photo.title}</h3>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                <Link
                  href={`/${locale}/contact?photo=${encodeURIComponent(photo.title)}`}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-charcoal hover:text-orange transition-colors opacity-0 group-hover:opacity-100"
                  title="Inquire about this photo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </Link>
                <button
                  onClick={() => remove(photo.id)}
                  aria-label="Remove from favorites"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-orange hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
