'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Admin navbar */}
      <header className="bg-white border-b border-[#d1d1d1] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="DAVEJAVU" width={80} height={40} className="object-contain" />
          <span className="text-[11px] uppercase tracking-widest text-mid-gray">Admin</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/admin/messages" className="text-xs uppercase tracking-widest text-charcoal hover:text-orange transition-colors">Messages</a>
          <button
            onClick={handleSignOut}
            className="text-xs uppercase tracking-widest text-mid-gray hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-3xl font-700 text-charcoal mb-2">Dashboard</h1>
        <p className="text-sm text-mid-gray mb-12">Photo management — more coming soon.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Photos', value: '—', hint: 'Published photos' },
            { label: 'Messages', value: '—', hint: 'Unread inquiries' },
            { label: 'Collections', value: '—', hint: 'Active collections' },
          ].map(({ label, value, hint }) => (
            <div key={label} className="bg-white border border-[#d1d1d1] rounded p-6">
              <p className="text-[11px] uppercase tracking-widest text-mid-gray mb-2">{label}</p>
              <p className="text-4xl font-700 text-charcoal">{value}</p>
              <p className="text-xs text-mid-gray mt-1">{hint}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
