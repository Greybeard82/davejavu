import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Route-level smoke test: every main public page, in all six locales, must
// return 200 and must render that locale's copy rather than English.
//
// Opt-in. It needs a running production build, so it is skipped unless
// SMOKE_BASE_URL is set. That keeps `npm test` and CI green without a server
// or production credentials, while still giving a real check locally:
//
//   npm run build
//   npx next start -p 3001
//   SMOKE_BASE_URL=http://localhost:3001 npx vitest run tests/locales.smoke.test.js
//
// It only reads pages over HTTP from the base URL it is given. It calls no
// service directly and writes nothing.

const BASE = process.env.SMOKE_BASE_URL;
const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de'];

const messages = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(readFileSync(join(process.cwd(), 'messages', `${l}.json`), 'utf8'))])
);

// React escapes text nodes and attributes, so decode before searching for copy
// that contains an apostrophe, an ampersand or a quote.
const decode = (html) =>
  html
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  return { status: res.status, html: decode(await res.text()) };
}

// A Next.js error page renders this marker on the <html> element. Checking for
// it is more reliable than looking for the word "error" in the body.
const isErrorPage = (html) => html.includes('id="__next_error__"');

// A small, precise set of English chrome strings. Each one is copy this branch
// routed through a key, so its presence on a non-English page means that page
// fell back to English.
const ENGLISH_MARKERS = {
  collections: ['Series of photographs grouped by place and atmosphere.'],
  photo: ['Behind the lens', 'Choose your size and pay in the basket'],
  license: ['Back to portfolio', 'What you are buying'],
  contact: ['Get in Touch', 'Interested in licensing a photo'],
};

const ctx = { uuid: null, slug: null };

const describeIf = BASE ? describe : describe.skip;

describeIf('locale smoke test', () => {
  beforeAll(async () => {
    const home = await get('/en');
    expect(home.status, `${BASE}/en did not respond with 200`).toBe(200);
    // The grid cards open a lightbox rather than linking out, so there is no
    // /photo/ href to scrape. The ids are in the streamed payload instead.
    ctx.uuid = home.html.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0] ?? null;

    const collections = await get('/en/collections');
    ctx.slug = collections.html.match(/\/en\/collections\/([a-z0-9-]+)"/)?.[1] ?? null;
  });

  describe.each(LOCALES)('%s', (locale) => {
    const m = messages[locale];

    it('home renders', async () => {
      const { status, html } = await get(`/${locale}`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      // The navbar is server-rendered on every page and its basket control
      // carries a translated aria-label, so it proves messages are live.
      expect(html).toContain(m.nav.basket);
      expect(html).toContain(m.nav.openMenu);
    });

    it('collections index renders in this language', async () => {
      const { status, html } = await get(`/${locale}/collections`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.collections.subtitle);
      if (locale !== 'en') {
        for (const marker of ENGLISH_MARKERS.collections) expect(html).not.toContain(marker);
      }
    });

    it('collection detail renders', async () => {
      expect(ctx.slug, 'no published collection found on /en/collections').toBeTruthy();
      const { status, html } = await get(`/${locale}/collections/${ctx.slug}`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.collections.title);
    });

    it('photo detail renders in this language', async () => {
      expect(ctx.uuid, 'no photo link found on /en').toBeTruthy();
      const { status, html } = await get(`/${locale}/photo/${ctx.uuid}`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      if (locale !== 'en') {
        for (const marker of ENGLISH_MARKERS.photo) expect(html).not.toContain(marker);
      }
    });

    it('license renders in this language', async () => {
      const { status, html } = await get(`/${locale}/license`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.license.title);
      expect(html).toContain(m.license.sections[0].heading);
      if (locale !== 'en') {
        for (const marker of ENGLISH_MARKERS.license) expect(html).not.toContain(marker);
      }
    });

    it('contact renders in this language', async () => {
      const { status, html } = await get(`/${locale}/contact`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.contact.title);
      expect(html).toContain(m.contact.subtitle);
      if (locale !== 'en') {
        for (const marker of ENGLISH_MARKERS.contact) expect(html).not.toContain(marker);
      }
    });

    it('pricing renders in this language', async () => {
      const { status, html } = await get(`/${locale}/pricing`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.pricing.subtitle);
    });

    it('about renders in this language', async () => {
      const { status, html } = await get(`/${locale}/about`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.about.storyHeading);
    });

    // Favourites and basket hydrate from localStorage and render nothing on the
    // server, so only the route and the shared chrome are checked here.
    it('favorites route responds', async () => {
      const { status, html } = await get(`/${locale}/favorites`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.nav.basket);
    });

    it('basket route responds', async () => {
      const { status, html } = await get(`/${locale}/basket`);
      expect(status).toBe(200);
      expect(isErrorPage(html)).toBe(false);
      expect(html).toContain(m.nav.basket);
    });

    it('a missing collection renders the localised 404', async () => {
      const { status, html } = await get(`/${locale}/collections/no-such-collection-xyz`);
      expect(status).toBe(404);
      expect(html).toContain(m.notFound.title);
    });

    // A path that matches no route at all is handled by the root not-found
    // boundary, which sits above [locale] and so has no language. Only the
    // status is asserted here; the English body is a known limitation.
    it('an unrouted path still returns 404', async () => {
      const { status } = await get(`/${locale}/no-such-page-xyz`);
      expect(status).toBe(404);
    });
  });
});
