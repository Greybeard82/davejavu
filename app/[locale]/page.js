import { createAdminClient } from '@/lib/supabase-admin';
import HeroCarousel from '@/components/HeroCarousel';
import PhotoGrid from '@/components/PhotoGrid';
import { getGridUrl, getHeroUrl } from '@/lib/cloudinary';

function shapePhoto(photo, locale) {
  const thirtyDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
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
}

const PHOTO_SELECT = `id, cloudinary_id, featured, available_for_license, created_at,
  photo_translations ( locale, title, location ),
  photo_moods ( mood )`;

async function getPageData(locale) {
  const supabase = createAdminClient();
  const [{ data: published, error: pubErr }, { data: featured, error: featErr }, { data: moodsData }] = await Promise.all([
    supabase.from('photos').select(PHOTO_SELECT).eq('published', true).order('created_at', { ascending: false }),
    supabase.from('photos').select(PHOTO_SELECT).eq('featured', true).limit(6),
    supabase.from('moods').select('name').order('name'),
  ]);
  if (pubErr) console.error('published query error:', pubErr);
  if (featErr) console.error('featured query error:', featErr);
  return {
    photos: (published || []).map((p) => shapePhoto(p, locale)),
    heroSlides: (featured || []).map((p) => ({ ...shapePhoto(p, locale), image: getHeroUrl(p.cloudinary_id) })),
    moods: (moodsData || []).map((r) => r.name),
  };
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  const { photos, heroSlides, moods } = await getPageData(locale);

  return (
    <>
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}
      <PhotoGrid photos={photos} locale={locale} moods={moods} />
    </>
  );
}
