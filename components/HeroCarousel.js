'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Placeholder slides — replaced with DB-driven featured photos once photos are uploaded
const PLACEHOLDER_SLIDES = [
  { id: 1, image: 'https://picsum.photos/seed/dj-hero1/1920/1080', title: 'Into the Mist', location: 'Zhangjiajie, China' },
  { id: 2, image: 'https://picsum.photos/seed/dj-hero2/1920/1080', title: 'Golden Hour', location: 'Kyoto, Japan' },
  { id: 3, image: 'https://picsum.photos/seed/dj-hero3/1920/1080', title: 'Urban Silence', location: 'Seoul, South Korea' },
  { id: 4, image: 'https://picsum.photos/seed/dj-hero4/1920/1080', title: 'River of Light', location: 'Hanoi, Vietnam' },
  { id: 5, image: 'https://picsum.photos/seed/dj-hero5/1920/1080', title: 'Vast', location: 'Banff, Canada' },
];

export default function HeroCarousel({ slides = PLACEHOLDER_SLIDES }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next, paused]);

  const scrollToPortfolio = () => {
    document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          {/* Ken Burns */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08, x: '-1%', y: '-0.5%' }}
            transition={{ duration: 10, ease: 'linear' }}
          >
            <img
              src={slides[current].image}
              alt={slides[current].title}
              className="w-full h-full object-cover"
              draggable="false"
            />
          </motion.div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Text overlay — bottom left */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${current}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute bottom-24 left-8 md:left-16 text-white"
        >
          <p className="text-xs uppercase tracking-[4px] font-300 mb-2 opacity-80">
            {slides[current].location}
          </p>
          <h2 className="text-4xl md:text-6xl font-700 tracking-tight leading-none">
            {slides[current].title}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* CTA — centre bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <button
          onClick={scrollToPortfolio}
          className="bg-white/10 backdrop-blur-sm border border-white/40 text-white text-xs uppercase tracking-[3px] font-600 px-8 py-3 hover:bg-orange hover:border-orange transition-all duration-300"
        >
          View Portfolio
        </button>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-10 right-8 md:right-16 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
