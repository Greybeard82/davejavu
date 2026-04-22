'use client';

import { useState } from 'react';

const WALLS = [
  { key: 'warm',  label: 'Warm White', bg: '#f0ede8', texture: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.012) 2px,rgba(0,0,0,0.012) 4px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(0,0,0,0.008) 2px,rgba(0,0,0,0.008) 4px)' },
  { key: 'stone', label: 'Stone',      bg: '#d6d2cc', texture: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)' },
  { key: 'dark',  label: 'Charcoal',   bg: '#2a2a2a', texture: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.015) 3px,rgba(255,255,255,0.015) 6px)' },
];

const SIZES = [
  { key: 'sm', label: 'A4',  desc: '21×30 cm', width: '22%' },
  { key: 'md', label: 'A3',  desc: '30×42 cm', width: '34%' },
  { key: 'lg', label: 'A2',  desc: '42×60 cm', width: '48%' },
];

export default function WallMockup({ src, title }) {
  const [open, setOpen] = useState(false);
  const [wall, setWall] = useState('warm');
  const [size, setSize] = useState('md');

  const currentWall = WALLS.find((w) => w.key === wall);
  const currentSize = SIZES.find((s) => s.key === size);
  const isDark = wall === 'dark';
  const labelColor = isDark ? '#ffffff' : '#1a1a1a';
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[10px] uppercase tracking-[3px] text-mid-gray hover:text-orange transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="1"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
        See it on your wall
      </button>

      {/* Full-screen mockup */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: currentWall.bg, backgroundImage: currentWall.texture }}
        >
          {/* Controls bar — solid background so it's always visible */}
          <div
            className="flex items-center justify-between gap-6 px-6 py-4 flex-wrap shrink-0"
            style={{ background: isDark ? '#1a1a1a' : '#ffffff', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}
          >
            {/* Photo title */}
            <span className="text-xs font-600 uppercase tracking-widest" style={{ color: labelColor }}>
              {title}
            </span>

            <div className="flex items-center gap-8 flex-wrap">
              {/* Wall swatches */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest mr-2" style={{ color: mutedColor }}>Wall</span>
                {WALLS.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => setWall(w.key)}
                    title={w.label}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: w.bg,
                      border: `2px solid ${wall === w.key ? '#F07E2F' : 'rgba(0,0,0,0.25)'}`,
                      outline: wall === w.key ? '2px solid rgba(240,126,47,0.3)' : 'none',
                      outlineOffset: '1px',
                    }}
                  />
                ))}
              </div>

              {/* Size buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-widest mr-2" style={{ color: mutedColor }}>Size</span>
                {SIZES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSize(s.key)}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
                    style={{
                      background: size === s.key ? '#F07E2F' : 'transparent',
                      color: size === s.key ? '#ffffff' : mutedColor,
                      border: `1px solid ${size === s.key ? '#F07E2F' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    }}
                  >
                    {s.label} <span className="opacity-60 normal-case tracking-normal">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors"
              style={{
                color: labelColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Close
            </button>
          </div>

          {/* Wall scene */}
          <div className="flex-1 flex items-center justify-center overflow-hidden px-8">
            <div className="flex flex-col items-center" style={{ width: currentSize.width, minWidth: '200px', maxWidth: '90vw' }}>

              {/* Framed photo */}
              <div
                style={{
                  width: '100%',
                  background: '#1a1a1a',
                  padding: '8px',
                  boxShadow: isDark
                    ? '0 30px 80px rgba(0,0,0,0.8), 0 8px 20px rgba(0,0,0,0.6)'
                    : '0 30px 80px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)',
                }}
              >
                {/* White mat */}
                <div style={{ background: '#faf9f7', padding: '8%' }}>
                  <img
                    src={src}
                    alt={title}
                    draggable="false"
                    className="w-full h-auto block"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}
                  />
                </div>
              </div>

              {/* Size label */}
              <p className="mt-5 text-[10px] uppercase tracking-[3px]" style={{ color: mutedColor }}>
                {currentSize.desc} print
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
