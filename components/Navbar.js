'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];

export default function Navbar({ locale, collections = [] }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopCollectionsOpen, setDesktopCollectionsOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [basketCount, setBasketCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const readCounts = () => {
      try {
        const fav = JSON.parse(localStorage.getItem('davejavu_favorites') || '[]').length;
        const basket = JSON.parse(localStorage.getItem('davejavu_basket') || '[]').length;
        setFavCount(prev => prev === fav ? prev : fav);
        setBasketCount(prev => prev === basket ? prev : basket);
      } catch { /* ignore */ }
    };
    readCounts();
    window.addEventListener('storage', readCounts);
    window.addEventListener('basket-updated', readCounts);
    return () => {
      window.removeEventListener('storage', readCounts);
      window.removeEventListener('basket-updated', readCounts);
    };
  }, []);

  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  const link = (path) => `/${locale}${path === '/' ? '' : path}`;

  const switchLocalePath = (newLocale) => `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#FAF9F6] shadow-sm' : 'bg-[#FAF9F6]/95'
        }`}
        style={{ height: '72px' }}
      >
        <div className="max-w-[1800px] mx-auto px-6 h-full flex items-center">

          <nav className="hidden md:flex items-center gap-8 flex-1">
            <Link href={link('/')} className={`text-xs font-400 uppercase tracking-widest transition-colors hover:text-orange ${pathWithoutLocale === '/' ? 'text-orange' : 'text-charcoal'}`}>
              {t('portfolio')}
            </Link>

            {/* Collections dropdown */}
            <div className="relative">
              <button
                onClick={() => { setDesktopCollectionsOpen(o => !o); setLangOpen(false); }}
                className="flex items-center gap-1 text-xs font-400 uppercase tracking-widest text-charcoal hover:text-orange transition-colors"
              >
                {t('collections')}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${desktopCollectionsOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {desktopCollectionsOpen && (
                <div className="absolute top-full left-0 mt-3 w-48 bg-[#FAF9F6] border border-[#d1d1d1] shadow-lg rounded py-2 z-50">
                  {collections.map((c) => (
                    <Link
                      key={c.slug}
                      href={link(`/collections/${c.slug}`)}
                      onClick={() => setDesktopCollectionsOpen(false)}
                      className="block px-4 py-2 text-xs uppercase tracking-wider text-charcoal hover:text-orange hover:bg-[#f4f3ef] transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={link('/about')} className={`text-xs font-400 uppercase tracking-widest transition-colors hover:text-orange ${pathWithoutLocale === '/about' ? 'text-orange' : 'text-charcoal'}`}>{t('about')}</Link>
            <Link href={link('/pricing')} className={`text-xs font-400 uppercase tracking-widest transition-colors hover:text-orange ${pathWithoutLocale === '/pricing' ? 'text-orange' : 'text-charcoal'}`}>{t('pricing')}</Link>
            <Link href={link('/contact')} className={`text-xs font-400 uppercase tracking-widest transition-colors hover:text-orange ${pathWithoutLocale === '/contact' ? 'text-orange' : 'text-charcoal'}`}>{t('contact')}</Link>
          </nav>

          <Link href={link('/')} className="flex items-center shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
            <Image
              src="/logo.png"
              alt="DAVEJAVU"
              width={150}
              height={75}
              className="object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center gap-5 flex-1 justify-end">

            <div className="relative">
              <button
                onClick={() => { setLangOpen(o => !o); setCollectionsOpen(false); }}
                className="text-xs font-600 uppercase tracking-widest text-charcoal hover:text-orange transition-colors"
              >
                {locale.toUpperCase()}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`inline ml-1 transition-transform ${langOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-3 w-28 bg-[#FAF9F6] border border-[#d1d1d1] shadow-lg rounded py-2 z-50">
                  {LOCALES.map((l) => (
                    <Link
                      key={l}
                      href={switchLocalePath(l)}
                      onClick={() => setLangOpen(false)}
                      className={`block px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                        l === locale ? 'text-orange font-600' : 'text-charcoal hover:text-orange hover:bg-[#f4f3ef]'
                      }`}
                    >
                      {l}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={link('/favorites')} className="relative text-charcoal hover:text-orange transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {favCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange text-white text-[9px] font-700 rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {favCount}
                </span>
              )}
            </Link>

            <Link href={link('/basket')} className="relative text-charcoal hover:text-orange transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {basketCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange text-white text-[9px] font-700 rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {basketCount}
                </span>
              )}
            </Link>

          </div>

          <button
            className="md:hidden text-charcoal ml-auto p-3 -mr-3 touch-manipulation"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Open menu"
            type="button"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col pt-[72px] overflow-y-auto">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="absolute top-0 right-0 h-[72px] w-[72px] flex items-center justify-center text-charcoal touch-manipulation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <nav className="flex flex-col px-6 py-8 gap-5">
            {[
              { href: '/', label: t('portfolio') },
              { href: '/about', label: t('about') },
              { href: '/pricing', label: t('pricing') },
              { href: '/contact', label: t('contact') },
              { href: '/favorites', label: `${t('favorites')}${favCount > 0 ? ` (${favCount})` : ''}` },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={link(href)}
                onClick={() => setMenuOpen(false)}
                className={`text-xl font-700 uppercase tracking-widest transition-colors hover:text-orange py-1 ${pathWithoutLocale === href ? 'text-orange' : 'text-charcoal'}`}
              >
                {label}
              </Link>
            ))}

            <div>
              <button
                type="button"
                onClick={() => setMobileCollectionsOpen(o => !o)}
                className="flex items-center gap-2 text-xl font-700 uppercase tracking-widest text-charcoal hover:text-orange transition-colors py-1 w-full text-left"
              >
                {t('collections')}
                <svg width="12" height="7" viewBox="0 0 10 6" fill="none" className={`transition-transform mt-0.5 ${mobileCollectionsOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {mobileCollectionsOpen && (
                <div className="flex flex-col gap-1 mt-2 pl-1">
                  {collections.map((c) => (
                    <Link
                      key={c.slug}
                      href={link(`/collections/${c.slug}`)}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-400 uppercase tracking-wider text-mid-gray hover:text-orange transition-colors py-1"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="pb-8 pt-2 border-t border-[#e8e8e8] mt-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-3 flex-wrap">
                  {LOCALES.map((l) => (
                    <Link
                      key={l}
                      href={switchLocalePath(l)}
                      onClick={() => setMenuOpen(false)}
                      className={`text-sm uppercase tracking-widest font-600 py-1 px-2 ${l === locale ? 'text-orange' : 'text-charcoal hover:text-orange'}`}
                    >
                      {l}
                    </Link>
                  ))}
                </div>
                <Link
                  href={link('/basket')}
                  onClick={() => setMenuOpen(false)}
                  className="relative text-orange"
                  aria-label={t('basket')}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {basketCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-orange text-white text-[9px] font-700 rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {basketCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}

      {(desktopCollectionsOpen || langOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setDesktopCollectionsOpen(false); setLangOpen(false); }} />
      )}
    </>
  );
}
