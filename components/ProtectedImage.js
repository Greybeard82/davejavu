'use client';

export default function ProtectedImage({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable="false"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
