import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';
import { getGridUrl, getHeroUrl } from '@/lib/cloudinary';
import PhotoGrid from '@/components/PhotoGrid';

const getCollection = cache(async (slug, locale) => {
  const supabase = createAdminClient();

  // Fetch collection metadata
  const { data, error } = await supabase
    .from('collections')
    .select('id, slug, collection_translations ( locale, title, description )')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) return null;

  // Fetch ordered photos in this collection
  const { data: pcData } = await supabase
    .from('photo_collections')
    .select('photo_id, position')
    .eq('collection_id', data.id)
    .order('position');

  const photoIds = (pcData || []).map((pc) => pc.photo_id);

  let photos = [];
  if (photoIds.length > 0) {
    const { data: photosData } = await supabase
      .from('photos')
      .select(`
        id, cloudinary_id, available_for_license, featured, created_at,
        photo_translations ( locale, title, location ),
        photo_moods ( mood )
      `)
      .in('id', photoIds)
      .eq('published', true);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const ordered = photoIds
      .map((id) => (photosData || []).find((p) => p.id === id))
      .filter(Boolean);

    photos = ordered.map((photo) => {
      const t = photo.photo_translations?.find((x) => x.locale === locale)
             || photo.photo_translations?.find((x) => x.locale === 'en')
             || {};
      return {
        id: photo.id,
        image: getGridUrl(photo.cloudinary_id),
        heroImage: getHeroUrl(photo.cloudinary_id),
        title: t.title || '(untitled)',
        location: t.location || '',
        moods: photo.photo_moods?.map((m) => m.mood) || [],
        isNew: new Date(photo.created_at).getTime() > thirtyDaysAgo,
        licensed: photo.available_for_license ?? false,
        featured: photo.featured ?? false,
        blurhash: null,
      };
    });
  }

  const t = data.collection_translations?.find((x) => x.locale === locale)
         || data.collection_translations?.find((x) => x.locale === 'en')
         || {};

  return { title: t.title || '(untitled)', description: t.description || '', photos };
});

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const collection = await getCollection(slug, locale);
  if (!collection) return {};
  return {
    title: `${collection.title} — DAVEJAVU`,
    description: collection.description || `${collection.title} — Photography collection by DAVEJAVU`,
  };
}

export default async function CollectionPage({ params }) {
  const { slug, locale } = await params;
  const collection = await getCollection(slug, locale);

  if (!collection) notFound();

  return (
    <div className="pt-[72px]">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <p className="text-[10px] uppercase tracking-widest text-mid-gray mb-4">
          <Link href={`/${locale}/collections`} className="hover:text-orange transition-colors">
            Collections
          </Link>
          {' / '}
          <span className="text-charcoal">{collection.title}</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">{collection.title}</h1>
        {collection.description && (
          <p className="text-sm text-mid-gray mt-3 leading-relaxed max-w-xl">{collection.description}</p>
        )}
        <p className="text-[10px] uppercase tracking-widest text-mid-gray mt-4">
          {collection.photos.length} photo{collection.photos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <PhotoGrid photos={collection.photos} locale={locale} />
    </div>
  );
}
