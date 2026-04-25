import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getHeroUrl } from '@/lib/cloudinary';
import ProtectedImage from '@/components/ProtectedImage';
import BuyButtons from '@/components/BuyButtons';
import WallMockup from '@/components/WallMockup';
import AddToBasketButton from '@/components/AddToBasketButton';

const getPhotoDetail = cache(async (uuid, locale) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('photos')
    .select(`
      id, cloudinary_id, available_for_license, created_at, width, height,
      photo_translations ( locale, title, location, description, alt_text, behind_lens ),
      photo_moods ( mood ),
      photo_metadata ( camera_body, lens, focal_length, aperture, iso, shutter_speed )
    `)
    .eq('id', uuid)
    .eq('published', true)
    .single();

  if (error || !data) return null;

  const t = data.photo_translations?.find((x) => x.locale === locale)
         || data.photo_translations?.find((x) => x.locale === 'en')
         || {};

  const meta = data.photo_metadata?.[0] || {};

  return {
    id: data.id,
    cloudinaryId: data.cloudinary_id,
    image: getHeroUrl(data.cloudinary_id),
    title: t.title || '(untitled)',
    location: t.location || '',
    description: t.description || '',
    behindLens: t.behind_lens || '',
    altText: t.alt_text || t.title || '',
    moods: data.photo_moods?.map((m) => m.mood) || [],
    licensed: data.available_for_license ?? false,
    width: data.width || null,
    height: data.height || null,
    meta: {
      cameraBody: meta.camera_body || '',
      lens: meta.lens || '',
      focalLength: meta.focal_length || '',
      aperture: meta.aperture || '',
      iso: meta.iso ? String(meta.iso) : '',
      shutterSpeed: meta.shutter_speed || '',
    },
  };
});

export async function generateMetadata({ params }) {
  const { uuid, locale } = await params;
  const photo = await getPhotoDetail(uuid, locale);
  if (!photo) return {};
  return {
    title: `${photo.title} — DAVEJAVU`,
    description: photo.description || `${photo.title} — Fine art photography by DAVEJAVU`,
    openGraph: { images: [{ url: photo.image }] },
  };
}

export default async function PhotoDetailPage({ params }) {
  const { uuid, locale } = await params;
  const [photo, t] = await Promise.all([
    getPhotoDetail(uuid, locale),
    getTranslations({ locale, namespace: 'photo' }),
  ]);

  if (!photo) notFound();

  const metaRows = [
    { label: 'Camera', value: photo.meta.cameraBody },
    { label: 'Lens', value: photo.meta.lens },
    { label: 'Focal length', value: photo.meta.focalLength },
    { label: 'Aperture', value: photo.meta.aperture },
    { label: 'ISO', value: photo.meta.iso },
    { label: 'Shutter speed', value: photo.meta.shutterSpeed },
  ].filter((r) => r.value);

  return (
    <article className="max-w-[1800px] mx-auto px-6 pt-[72px] md:flex md:gap-12 lg:gap-20 md:min-h-screen">

      {/* Left — sticky image */}
      <div className="md:w-[58%] lg:w-[62%] md:sticky md:top-[72px] md:self-start md:h-[calc(100vh-72px)] flex items-center justify-center py-10">
        <ProtectedImage
          src={photo.image}
          alt={photo.altText}
          className="max-w-full max-h-[80vh] object-contain shadow-lg"
        />
      </div>

      {/* Right — info panel */}
      <div className="md:w-[42%] lg:w-[38%] py-10 md:py-20">

        {/* Back link */}
        <Link
          href={`/${locale}#portfolio`}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-mid-gray hover:text-orange transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t('portfolio')}
        </Link>

        {/* Title + location */}
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight leading-tight mt-6">
          {photo.title}
        </h1>
        {photo.location && (
          <p className="text-xs uppercase tracking-[4px] text-mid-gray mt-3">{photo.location}</p>
        )}

        {/* Mood tags */}
        {photo.moods.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {photo.moods.map((mood) => (
              <span
                key={mood}
                className="text-[10px] uppercase tracking-wider border border-[#d1d1d1] text-charcoal px-3 py-1 rounded-full"
              >
                {mood}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {photo.description && (
          <>
            <hr className="border-[#d1d1d1] my-8" />
            <p className="text-sm text-charcoal leading-relaxed">{photo.description}</p>
          </>
        )}

        {/* Behind the lens */}
        {photo.behindLens && (
          <>
            <hr className="border-[#d1d1d1] my-8" />
            <h2 className="text-[10px] uppercase tracking-widest text-mid-gray mb-4">Behind the lens</h2>
            <p className="text-sm text-charcoal leading-relaxed">{photo.behindLens}</p>
          </>
        )}

        {/* Camera metadata */}
        {metaRows.length > 0 && (
          <>
            <hr className="border-[#d1d1d1] my-8" />
            <h2 className="text-[10px] uppercase tracking-widest text-mid-gray mb-4">Camera</h2>
            <table className="w-full">
              <tbody>
                {metaRows.map(({ label, value }) => (
                  <tr key={label} className="border-b border-[#d1d1d1]">
                    <td className="text-[10px] uppercase tracking-widest text-mid-gray py-2.5 pr-4 w-1/2">{label}</td>
                    <td className="text-xs text-charcoal py-2.5">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Wall mockup */}
        <hr className="border-[#d1d1d1] my-8" />
        <WallMockup src={photo.image} title={photo.title} locale={locale} />

        {/* Buy section */}
        {photo.licensed && (
          <>
            <hr className="border-[#d1d1d1] my-8" />
            <h2 className="text-[10px] uppercase tracking-widest text-mid-gray mb-5">Get this photo</h2>
            <AddToBasketButton photo={{ id: photo.id, title: photo.title, image: photo.image, width: photo.width, height: photo.height }} />
            <p className="text-[10px] text-mid-gray mt-3">Choose your size and pay in the basket</p>
          </>
        )}

        <div className="h-10 md:h-0" />
      </div>
    </article>
  );
}
