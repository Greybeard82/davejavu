'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer({ locale }) {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  const link = (path) => `/${locale}${path}`;

  return (
    <footer className="bg-[#f4f3ef] border-t border-[#d1d1d1] mt-24">
      <div className="max-w-[1800px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="font-700 text-xs uppercase tracking-widest text-charcoal">DAVEJAVU</p>
          <p className="text-xs text-mid-gray mt-1 tracking-wide">{t('tagline')}</p>
        </div>

        <div className="flex items-center gap-6 text-xs uppercase tracking-widest">
          <a
            href="https://www.instagram.com/davejavu82"
            target="_blank"
            rel="noopener noreferrer"
            className="text-charcoal hover:text-orange transition-colors"
          >
            Instagram
          </a>
          <Link href={link('/license')} className="text-charcoal hover:text-orange transition-colors">
            {t('terms')}
          </Link>
          <Link href={link('/contact')} className="text-charcoal hover:text-orange transition-colors">
            {t('contact')}
          </Link>
        </div>

        <p className="text-xs text-mid-gray tracking-wide">
          © {year} DAVEJAVU. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
