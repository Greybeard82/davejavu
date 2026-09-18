import next from 'eslint-config-next/core-web-vitals';

// Flat config for ESLint 9. `next lint` was removed in Next 16; this replaces it.
// eslint-config-next@16 ships a native flat-config array, so we spread it directly.
//
// Severity decisions (see the toolchain branch report):
// - react-hooks/set-state-in-effect -> warn: the localStorage->state hydration
//   in useEffect is deliberate and correct (avoids SSR hydration mismatch).
// - react/no-unescaped-entities -> error (kept): a literal apostrophe in JSX is
//   untranslated inline text, a real bug on a six-language site.
// - react-hooks/purity -> error (kept): Date.now() during render in the admin
//   login is the lockout control — security logic, not a smell.
// - @next/next/no-img-element -> warning (kept): tracked separately.
const config = [
  ...next,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'graphify-out/**',
      'docs/**',
      '_redesign/**',
      'SAmple pics/**',
      'coverage/**',
    ],
  },
];

export default config;
