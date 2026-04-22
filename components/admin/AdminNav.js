'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const LINKS = [
  { href: '/admin/dashboard', label: 'Photos' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/moods', label: 'Moods' },
  { href: '/admin/messages', label: 'Messages' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
  };

  return (
    <header className="bg-white border-b border-[#d1d1d1] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 gap-4">
      <span className="font-700 text-xs uppercase tracking-widest text-charcoal shrink-0">DAVEJAVU Admin</span>
      <nav className="flex items-center gap-4 md:gap-6 overflow-x-auto">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`text-xs uppercase tracking-widest shrink-0 transition-colors ${
              pathname === l.href ? 'text-orange font-600' : 'text-mid-gray hover:text-charcoal'
            }`}
          >
            {l.label}
          </a>
        ))}
        <button
          onClick={handleSignOut}
          className="text-xs uppercase tracking-widest text-mid-gray hover:text-red-500 transition-colors shrink-0"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
