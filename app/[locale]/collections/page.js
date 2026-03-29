import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';

async function getCollections(locale) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('collections')
    .select(`
      id, slug,
      collection_translations ( locale, title, description ),
      cover:cover_photo_id ( cloudinary_id ),
      photo_collections ( photo_id )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return data.map((c) => {
    const t = c.collection_translations?.find((x) => x.locale === locale)
           || c.collection_translations?.find((x) => x.locale === 'en')
           || {};
    return {
      id: c.id,
      slug: c.slug,
      title: t.title || '(untitled)',
      description: t.description || '',
      photoCount: c.photo_collections?.length || 0,
      coverUrl: c.cover?.cloudinary_id
        ? `https://res.cloudinary.com/${CLOUD}/image/upload/w_800,h_600,c_fill,q_75,f_jpg/${c.cover.cloudinary_id}`
        : null,
    };
  });
}

export const metadata = {
  title: 'Collections — DAVEJAVU',
  description: 'Series of photographs grouped by place and atmosphere.',
};

export default async function CollectionsPage({ params }) {
  const { locale } = params;
  const collections = await getCollections(locale);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-16 mb-12">
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">Collections</h1>
        <p className="text-sm text-mid-gray mt-2 leading-relaxed">
          Series of photographs grouped by place and atmosphere.
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-mid-gray py-20 text-center">No collections yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((c) => (
            <Link key={c.id} href={`/${locale}/collections/${c.slug}`} className="group block">
              <div className="relative overflow-hidden aspect-[4/3] bg-[#e8e6e1] rounded">
                {c.coverUrl ? (
                  <img
                    src={c.coverUrl}
                    alt={c.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#d1d1d1]">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-white font-700 text-xl tracking-tight">{c.title}</h2>
                  <p className="text-white/60 text-[10px] uppercase tracking-[3px] mt-1">
                    {c.photoCount} photo{c.photoCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {c.description && (
                <p className="text-sm text-mid-gray mt-3 leading-relaxed line-clamp-2">{c.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
