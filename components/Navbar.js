'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];

const COLLECTIONS = [
  { slug: 'china', name: 'China' },
  { slug: 'japan', name: 'Japan' },
  { slug: 'south-korea', name: 'South Korea' },
  { slug: 'vietnam', name: 'Vietnam' },
  { slug: 'thailand', name: 'Thailand' },
  { slug: 'canada', name: 'Canada' },
  { slug: 'barcelona-spain', name: 'Barcelona & Spain' },
];

export default function Navbar({ locale }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('davejavu_favorites') || '[]');
    setFavCount(stored.length);
    const onStorage = () => {
      const updated = JSON.parse(localStorage.getItem('davejavu_favorites') || '[]');
      setFavCount(updated.length);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href={link('/')} className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="DAVEJAVU"
              width={130}
              height={65}
              className="object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={link('/')}
              className="text-xs font-400 uppercase tracking-widest text-charcoal hover:text-orange transition-colors"
            >
              Portfolio
            </Link>

            {/* Collections dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCollectionsOpen(o => !o); setLangOpen(false); }}
                className="flex items-center gap-1 text-xs font-400 uppercase tracking-widest text-charcoal hover:text-orange transition-colors"
              >
                Collections
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${collectionsOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {collectionsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-[#FAF9F6] border border-[#d1d1d1] shadow-lg rounded py-2 z-50">
                  {COLLECTIONS.map((c) => (
                    <Link
                      key={c.slug}
                      href={link(`/collections/${c.slug}`)}
                      onClick={() => setCollectionsOpen(false)}
                      className="block px-4 py-2 text-xs uppercase tracking-wider text-charcoal hover:text-orange hover:bg-[#f4f3ef] transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={link('/about')} className="text-xs font-400 uppercase tracking-widest text-charcoal hover:text-orange transition-colors">About</Link>
            <Link href={link('/pricing')} className="text-xs font-400 uppercase tracking-widest text-charcoal hover:text-orange transition-colors">Pricing</Link>
            <Link href={link('/contact')} className="text-xs font-400 uppercase tracking-widest text-charcoal hover:text-orange transition-colors">Contact</Link>
          </nav>

          {/* Right side: lang + favorites */}
          <div className="hidden md:flex items-center gap-5">
            {/* Language switcher */}
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

            {/* Favorites */}
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
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-charcoal"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Open menu"
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
        <div className="fixed inset-0 z-40 bg-[#FAF9F6] flex flex-col pt-24 px-8 md:hidden">
          <nav className="flex flex-col gap-6">
            {[
              { href: '/', label: 'Portfolio' },
              { href: '/about', label: 'About' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/contact', label: 'Contact' },
              { href: '/favorites', label: `Favorites${favCount > 0 ? ` (${favCount})` : ''}` },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={link(href)}
                onClick={() => setMenuOpen(false)}
                className="text-2xl font-700 uppercase tracking-widest text-charcoal hover:text-orange transition-colors"
              >
                {label}
              </Link>
            ))}

            <div>
              <p className="text-xs uppercase tracking-widest text-mid-gray mb-3">Collections</p>
              <div className="flex flex-col gap-3">
                {COLLECTIONS.map((c) => (
                  <Link
                    key={c.slug}
                    href={link(`/collections/${c.slug}`)}
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-400 uppercase tracking-wider text-charcoal hover:text-orange transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-mid-gray mb-3">Language</p>
              <div className="flex gap-4 flex-wrap">
                {LOCALES.map((l) => (
                  <Link
                    key={l}
                    href={switchLocalePath(l)}
                    onClick={() => setMenuOpen(false)}
                    className={`text-sm uppercase tracking-widest font-600 ${l === locale ? 'text-orange' : 'text-charcoal hover:text-orange'}`}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(collectionsOpen || langOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setCollectionsOpen(false); setLangOpen(false); }} />
      )}
    </>
  );
}
