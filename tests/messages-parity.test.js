import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Guards the six message catalogues against drift. A key added to English and
// forgotten elsewhere is invisible until a visitor hits that page in that
// language, so it is caught here instead.
//
// Pure: reads six JSON files, touches no service and no network.

const MESSAGES_DIR = join(process.cwd(), 'messages');
const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];
const REFERENCE = 'en';

const load = (locale) => JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8'));

// Flattens to dot paths, walking into arrays by index so that
// license.sections.0.heading is a key. That makes a missing or extra section
// in one language a parity failure rather than a silent difference.
function flatten(value, prefix = '', out = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, value);
  }
  return out;
}

// ICU argument names: {title}, and the leading name of {count, plural, ...}.
const placeholders = (s) =>
  typeof s === 'string' ? [...s.matchAll(/\{\s*(\w+)/g)].map((m) => m[1]).sort() : [];

const catalogues = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))]));
const referenceKeys = [...catalogues[REFERENCE].keys()].sort();

describe('message catalogues', () => {
  it('the locale list matches the files on disk', () => {
    const onDisk = readdirSync(MESSAGES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(onDisk).toEqual([...LOCALES].sort());
  });

  it('English is not empty', () => {
    expect(referenceKeys.length).toBeGreaterThan(100);
  });
});

describe.each(LOCALES.filter((l) => l !== REFERENCE))('%s matches English', (locale) => {
  const keys = [...catalogues[locale].keys()].sort();

  it('has no missing keys', () => {
    const missing = referenceKeys.filter((k) => !catalogues[locale].has(k));
    expect(missing).toEqual([]);
  });

  it('has no extra keys', () => {
    const extra = keys.filter((k) => !catalogues[REFERENCE].has(k));
    expect(extra).toEqual([]);
  });

  it('uses the same ICU placeholders in every message', () => {
    const mismatched = referenceKeys
      .filter((k) => catalogues[locale].has(k))
      .filter((k) => {
        const a = placeholders(catalogues[REFERENCE].get(k));
        const b = placeholders(catalogues[locale].get(k));
        return a.join(',') !== b.join(',');
      });
    expect(mismatched).toEqual([]);
  });
});

describe.each(LOCALES)('%s values', (locale) => {
  it('are all non-empty strings', () => {
    const bad = [...catalogues[locale].entries()]
      .filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`);
    expect(bad).toEqual([]);
  });
});
