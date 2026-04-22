'use client';

import { useState } from 'react';

const WALLS = [
  { key: 'warm',  label: 'Warm White', bg: '#f0ede8', texture: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.012) 2px,rgba(0,0,0,0.012) 4px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(0,0,0,0.008) 2px,rgba(0,0,0,0.008) 4px)' },
  { key: 'stone', label: 'Stone',      bg: '#d6d2cc', texture: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(0,0,0,0.015) 2px,rgba(0,0,0,0.015) 4px)' },
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
        {open ? 'Hide wall mockup' : 'See it on your wall'}
      </button>

      {/* Mockup panel */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex flex-col"
          style={{ background: currentWall.bg, backgroundImage: currentWall.texture }}
        >
          {/* Controls bar */}
          <div
            className="flex items-center justify-between px-6 py-3 gap-4 flex-wrap"
            style={{ background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <span className={`text-[10px] uppercase tracking-[4px] font-600 ${isDark ? 'text-white/60' : 'text-mid-gray'}`}>
              {title}
            </span>

            <div className="flex items-center gap-6 flex-wrap">
              {/* Wall colour */}
              <div className="flex items-center gap-2">
                {WALLS.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => setWall(w.key)}
                    title={w.label}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: w.bg,
                      borderColor: wall === w.key ? '#F07E2F' : 'rgba(0,0,0,0.2)',
                    }}
                  />
                ))}
              </div>

              {/* Print size */}
              <div className="flex items-center gap-1">
                {SIZES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSize(s.key)}
                    className={`text-[10px] uppercase tracking-widest px-3 py-1 transition-colors ${
                      size === s.key
                        ? 'bg-orange text-white'
                        : isDark ? 'text-white/50 hover:text-white' : 'text-mid-gray hover:text-charcoal'
                    }`}
                  >
                    {s.label}
                    <span className="ml-1 normal-case tracking-normal opacity-60">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className={`text-[10px] uppercase tracking-[3px] flex items-center gap-2 transition-colors ${isDark ? 'text-white/50 hover:text-white' : 'text-mid-gray hover:text-charcoal'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Close
            </button>
          </div>

          {/* Wall scene */}
          <div className="flex-1 flex items-center justify-center">
            {/* Skirting board hint */}
            <div className="relative flex flex-col items-center" style={{ width: currentSize.width }}>

              {/* Frame */}
              <div
                style={{
                  width: '100%',
                  boxShadow: isDark
                    ? '0 20px 60px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.5)'
                    : '0 20px 60px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.12)',
                  background: '#1a1a1a',
                  padding: '10px',
                }}
              >
                {/* White mat */}
                <div style={{ background: '#faf9f7', padding: '8%' }}>
                  <img
                    src={src}
                    alt={title}
                    draggable="false"
                    className="w-full h-auto block select-none"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              </div>

              {/* Size label below frame */}
              <p
                className="mt-4 text-[10px] uppercase tracking-[3px]"
                style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
              >
                {currentSize.desc} print
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
