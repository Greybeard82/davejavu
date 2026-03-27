import { createAdminClient } from '@/lib/supabase-admin';
import HeroCarousel from '@/components/HeroCarousel';
import PhotoGrid from '@/components/PhotoGrid';
import { getGridUrl, getHeroUrl } from '@/lib/cloudinary';

async function getPublishedPhotos(locale) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('photos')
    .select(`
      id, cloudinary_id, featured, available_for_license, created_at,
      photo_translations ( locale, title, location ),
      photo_moods ( mood )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return data.map((photo) => {
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

export default async function HomePage({ params }) {
  const { locale } = params;
  const photos = await getPublishedPhotos(locale);
  const heroSlides = photos
    .filter((p) => p.featured)
    .slice(0, 6)
    .map((p) => ({ ...p, image: p.heroImage }));

  return (
    <>
      <HeroCarousel slides={heroSlides.length > 0 ? heroSlides : undefined} />
      <PhotoGrid photos={photos} locale={locale} />
    </>
  );
}
