import HeroCarousel from '@/components/HeroCarousel';
import PhotoGrid from '@/components/PhotoGrid';

export default function HomePage({ params }) {
  const { locale } = params;

  return (
    <>
      <HeroCarousel />
      <PhotoGrid locale={locale} />
    </>
  );
}
