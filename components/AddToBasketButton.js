'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { addToBasket, isInBasket } from '@/lib/basket';

export default function AddToBasketButton({ photo }) {
  const { locale } = useParams();
  const [inBasket, setInBasket] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setInBasket(isInBasket(photo.id));
    const onUpdate = () => setInBasket(isInBasket(photo.id));
    window.addEventListener('basket-updated', onUpdate);
    return () => window.removeEventListener('basket-updated', onUpdate);
  }, [photo.id]);

  const handleClick = () => {
    if (inBasket) return;
    const added = addToBasket({ photoId: photo.id, title: photo.title, image: photo.image });
    if (added) {
      setInBasket(true);
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={inBasket}
        className={`w-full py-4 text-xs uppercase tracking-[3px] font-600 transition-colors ${
          inBasket
            ? 'bg-[#f4f3ef] text-mid-gray cursor-default border border-[#d1d1d1]'
            : 'bg-charcoal text-white hover:bg-orange'
        }`}
      >
        {flash ? '✓ Added to basket' : inBasket ? 'In basket' : 'Add to basket'}
      </button>

      {inBasket && (
        <Link
          href={`/${locale}/basket`}
          className="w-full py-4 text-xs uppercase tracking-[3px] font-600 text-center bg-orange text-white hover:bg-orange-dark transition-colors"
        >
          Go to basket →
        </Link>
      )}
    </div>
  );
}
