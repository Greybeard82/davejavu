# Product Requirements Document

## DAVEJAVU Photography Portfolio

**Version:** 2.0
**Author:** David
**Stack:** Next.js 14 (App Router) + Supabase + Cloudinary + Claude API + Resend + next-intl + Tailwind CSS + Framer Motion + hCaptcha
**Hosting:** Netlify (via @netlify/plugin-nextjs adapter)

\---

## 1\. Project Overview

A personal photography portfolio website for landscape and cityscape photographer DAVEJAVU. The site displays photos, allows potential buyers to contact the photographer via a structured inquiry form, and provides a secure admin panel for content management and order fulfillment.

**Core goals:**

* High visual impact, dark editorial aesthetic, minimal UI (reference: https://davejavu.netlify.app)
* Emotional buyer focus: someone who sees a photo, feels something, and wants it on their wall
* Deter casual photo theft through layered technical measures (see Section 7)
* Full multilingual support across 6 languages
* Mobile-first, fully responsive
* Secure admin panel for content and order management
* Automated download link delivery on payment confirmation

\---

## 2\. Tech Stack

|Layer|Tool|Notes|
|-|-|-|
|Framework|Next.js 14 (App Router)|SSR + SSG, i18n routing, API routes|
|Database + Auth|Supabase|PostgreSQL, Row Level Security, TOTP 2FA|
|Image CDN + Processing|Cloudinary|Upload, compression, signed URLs, watermarking, auto-tagging|
|Multilingual SEO Copy|Claude API (claude-sonnet-4-20250514)|Takes Cloudinary tags as input, returns titles, descriptions, alt text in all 6 languages|
|Email|Resend|Contact form notifications + download link delivery|
|i18n|next-intl|Locale routing: /en /pt /es /fr /it /de|
|Styling|Tailwind CSS|Dark-first design system|
|Animation|Framer Motion|Photo expand/collapse, page transitions, hero carousel|
|CAPTCHA|hCaptcha|GDPR-friendly, EU-appropriate, contact form protection|
|Deployment|Netlify|Via @netlify/plugin-nextjs|

\---

## 3\. Supported Languages

|Code|Language|
|-|-|
|`en`|English (default)|
|`pt`|Portuguese|
|`es`|Spanish|
|`fr`|French|
|`it`|Italian|
|`de`|German|

All user-facing strings must be externalized into locale JSON files under `/messages/\\\[locale].json`. Language detection defaults to browser preference on first visit, with a visible language switcher in the nav. Locale is persisted in a cookie for return visits.

\---

## 4\. Site Architecture

```
/\\\[locale]                        → Home (hero carousel + mixed photo grid)
/\\\[locale]/photo/\\\[uuid]           → Individual photo page
/\\\[locale]/collections            → Collections overview
/\\\[locale]/collections/\\\[slug]     → Individual collection gallery
/\\\[locale]/about                  → About the photographer
/\\\[locale]/contact                → Contact / inquiry form
/\\\[locale]/pricing                → Pricing page
/\\\[locale]/privacy                → Privacy policy (GDPR)
/admin                           → Admin login (no locale prefix, not indexed)
/admin/dashboard                 → Photo management panel
/admin/messages                  → Inbox for contact form submissions + order management
/api/contact                     → Contact form submission handler
/api/photos/\\\[id]/token           → Generates signed, time-limited image token
/api/download/\\\[token]            → Serves download link for paid orders
/api/seo-suggest                 → Receives Cloudinary tags, calls Claude API, returns multilingual SEO copy
```

**Notes:**

* `/admin` routes are excluded from `sitemap.xml` and `robots.txt`
* All public photo routes use opaque UUIDs, not sequential IDs or filenames
* The language switcher preserves the current route across locale switches

\---

## 5\. Public-Facing Features

### 5.1 Hero Carousel

* Full-screen, viewport-height carousel at the top of the homepage
* Displays 5-6 photos flagged as "featured" by the admin (pulled from existing uploaded photos, no separate upload needed)
* Auto-advances every 5-6 seconds with manual prev/next controls
* Subtle Ken Burns effect (slow pan/zoom) on each slide for cinematic feel
* Photo title and location overlaid in bottom-left corner with a soft gradient underlay for legibility
* CTA button: "View Portfolio" scrolls down to the grid
* Admin manages featured photos and their order via the admin dashboard (see Section 8.2)

### 5.2 Homepage Grid

* Below the hero, a full mixed grid of all published photos across all collections
* Masonry layout
* Mood/vibe filter bar at the top of the grid (see 5.3)
* "New drop" badge on photos uploaded within the last 30 days
* Paginated: 24 photos per page
* Each card shows: display image, title, location tag, edition status if applicable (e.g. "Ed. 12/25"), and "Available for license" badge

### 5.3 Mood / Vibe Filters

Rather than generic category tags, photos are tagged with evocative mood descriptors. Examples:

* Golden Hour
* Blue Hour
* Storm
* Solitude
* Urban Chaos
* Mist
* Silence
* Neon
* Vast
* Intimate

Admin defines and manages mood tags. Multiple tags per photo allowed. Filter bar shows active tags as toggleable pills. Multiple filters can be active simultaneously (OR logic -- show photos matching any selected mood).

### 5.4 Collections

* Collections are named series of photos grouped by geography or theme
* **Launch collections:** China, Japan, South Korea, Vietnam, Thailand, Canada, Barcelona \& Spain
* Each collection has: name (localized), cover photo, short intro paragraph (localized), and a set of photos
* Collections accessible via a dropdown in the top navigation ("Collections ▾")
* Each collection has its own page (`/\\\[locale]/collections/\\\[slug]`) with its own masonry grid and intro
* A photo can belong to multiple collections
* Collections overview page shows all collections as large cards

### 5.5 Individual Photo Page (`/\\\[locale]/photo/\\\[uuid]`)

**1. Photo Display**

* Large display-safe version of the photo
* All theft deterrence measures active

**2. Photo Info**

* Title, location, description (all localized)
* Mood tags shown as decorative pills
* Edition status: "Edition X of Y" with remaining count (e.g. "7 of 25 remaining")
* "New" badge if uploaded within 30 days
* "Available for license" badge

**3. Wall Mockup Visualizer**

* Toggle button: "See it on your wall"
* Reveals a static, tasteful neutral-interior living room scene with the photo composited onto the wall using CSS scaling and absolute positioning
* No external service needed -- pure CSS/JS with a static background image
* Toggle again to hide

**4. Behind the Lens**

* A short personal paragraph from the photographer: where they were, what they were feeling, why they pressed the shutter at that moment
* Styled distinctly from technical metadata -- personal, editorial tone
* Optional field; hidden if empty

**5. Camera Metadata**

* Camera body, lens, focal length, aperture, ISO, shutter speed
* Displayed in a subtle minimal grid (not a table)
* All fields optional

**6. CTA**

* "Inquire about a license" button links to the contact form with this photo's title pre-filled

**7. Favorites Button**

* Heart icon; toggled into localStorage favorites (see 5.9)

### 5.6 Lightbox / Photo Expand

* On click from the grid, photo animates from its grid position to fill the viewport (Framer Motion `layoutId` shared layout animation with spring physics)
* Background dims with a backdrop blur overlay
* Click outside or press Escape to animate back to original grid position
* Left/right arrow navigation between photos without closing
* Mobile: swipe left/right to navigate, swipe down to dismiss
* All theft deterrence measures active inside the lightbox

### 5.7 Pricing Page (`/\\\[locale]/pricing`)

|License|What's included|Price|
|-|-|-|
|Personal License|High-res file, print for personal home use, non-commercial, single household|From €75|
|Extended Personal|High-res file, print multiple copies, give as a gift, personal use only|From €150|
|Commercial|Editorial, advertising, product use -- custom quote|Contact|

Additional page content:

* What "high-res file" means: format (JPG), typical file size, print-ready spec
* Payment methods: PayPal, bank transfer, Bizum (footnote: Bizum available for Spain-based buyers only)
* Brief "How it works" flow (see 5.8)
* Copyright notice: photographer retains full copyright; license grants usage rights only
* All prices in EUR

### 5.8 "How It Works" Section

Shown on the pricing page and optionally as a homepage section:

1. **Browse** -- explore the gallery and find a photo you love
2. **Inquire** -- fill in the contact form with the photo(s) you want and intended use
3. **Pay** -- receive a payment request via PayPal, bank transfer, or Bizum
4. **Download** -- receive a secure download link valid for 5 days with your high-res licensed file

### 5.9 Favorites / Wishlist

* Heart icon on every photo card and photo page
* Toggled entirely via localStorage -- no login or account needed
* A "Your Favorites" button appears in the nav when at least one photo is favorited (count badge)
* Favorites page (`/\\\[locale]/favorites`) shows all saved photos in a grid
* When the contact form is opened from the Favorites page, the "Photos of interest" field is pre-filled with all favorited photo titles
* Favorites persist across sessions until manually cleared

### 5.10 Contact / Inquiry Form (`/\\\[locale]/contact`)

Fields:

* Name (required)
* Email (required, validated)
* Subject: dropdown -- "Personal License" | "Extended Personal License" | "Commercial License" | "Other"
* Photos of interest: free text (pre-filled if coming from a photo page or favorites)
* Intended use: short free text
* Message (required, min 20 characters)
* hCaptcha widget (required)
* Honeypot field (hidden, bot detection)
* GDPR checkbox: "I agree to my data being stored to process this inquiry" (required)

On submit:

1. Server-side validation + hCaptcha verification in `/api/contact`
2. Message stored in Supabase `messages` table with timestamp, IP hash (hashed, not raw), status `unread`
3. Email notification sent to admin via Resend with full inquiry summary
4. User sees localized success confirmation (no page reload)
5. Rate limit: max 3 submissions per IP per hour

### 5.11 GDPR Compliance

* Cookie consent banner on first visit (accept / reject non-essential cookies)
* Privacy policy page at `/\\\[locale]/privacy`
* Contact form GDPR checkbox (required)
* Admin can delete messages, removing all associated personal data
* No third-party analytics or advertising trackers

### 5.12 Navigation

* Fixed top navbar: Logo left | Portfolio, Collections ▾, About, Pricing, Contact center | Language switcher + Favorites icon right
* Collections dropdown lists all active collections
* Mobile: hamburger menu with full-screen overlay nav
* Scroll-aware: navbar background becomes solid after scrolling past the hero
* Instagram link (@davejavu82) in the footer only -- no embed, no live feed

\---

## 6\. Image SEO Pipeline (Upload Flow)

When admin uploads a photo, the following automated sequence runs:

1. **Cloudinary upload** -- full-res file sent to Cloudinary; auto-tagging via Google Vision returns English content tags (e.g. `\\\["mountain", "fog", "sunrise", "landscape", "dramatic sky"]`)
2. **Claude API call** -- `/api/seo-suggest` sends those tags plus location (if provided) to the Claude API requesting:

   * Suggested title in all 6 languages
   * SEO meta description in all 6 languages (max 155 characters each)
   * Alt text in all 6 languages
   * 5 suggested mood/vibe tags
3. **Admin review** -- upload form pre-fills all metadata fields with Claude suggestions; admin reviews and edits before saving
4. **No blind auto-save** -- admin always has final say

Claude API prompt (server-side only, never exposed to client):

```
You are an SEO assistant for a landscape and cityscape photography portfolio.
Given these image tags: {tags}
And this location: {location}

Return ONLY a valid JSON object with no preamble or markdown. Structure:
{
  "titles": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "descriptions": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "alt\\\_text": { "en": "", "pt": "", "es": "", "fr": "", "it": "", "de": "" },
  "suggested\\\_moods": \\\[]
}
Descriptions must be under 155 characters. Titles evocative and under 60 characters.
Mood tags chosen from: \\\[Golden Hour, Blue Hour, Storm, Solitude, Urban Chaos, Mist, Silence, Neon, Vast, Intimate].
```

\---

## 7\. Photo Theft Deterrence

**Important:** No browser-side measure can prevent OS-level screenshots. The goal is to make casual theft annoying and low-value, and ensure any stolen copy is watermarked, compressed, and traceable to DAVEJAVU.

### 7.1 Right-click Disable

```javascript
document.addEventListener('contextmenu', e => e.preventDefault());
```

Applied globally on all public-facing pages. Does not affect the admin panel.

### 7.2 Drag-to-Save Block

All `<img>` elements: `draggable="false"` and `onDragStart={e => e.preventDefault()}`.

### 7.3 Transparent Overlay Div

A transparent `<div>` with `position: absolute; inset: 0; z-index: 10; pointer-events: all` over every displayed image. Blocks right-click on the image and prevents touch-hold save on iOS/Android.

### 7.4 Keyboard Shortcut Interception

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'PrintScreen') {
    e.preventDefault();
    navigator.clipboard.writeText('');
  }
  if ((e.ctrlKey || e.metaKey) \\\&\\\& \\\['s','u','p'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
```

Note: Cannot block OS-level shortcuts (Cmd+Shift+4, Win+Shift+S). Browser limitation, not a code limitation.

### 7.5 Display-Only Image Versions (Most Important Layer)

All displayed images are Cloudinary-transformed display copies:

* Maximum resolution: 1920px on the longest edge
* Quality: 65% JPEG compression
* Watermark: semi-transparent DAVEJAVU watermark, bottom-right, \~15% opacity
* Color profile stripped (sRGB only, no embedded print profiles)

The original full-resolution master is stored in a private Supabase Storage bucket and is never publicly accessible. Accessed server-side only for paid download generation.

### 7.6 Signed / Expiring Cloudinary URLs

* All display URLs signed with a secret key, 4-hour expiry
* Frontend fetches fresh signed URLs via Next.js server components on each page load
* Direct URL scraping produces links that expire and become invalid

### 7.7 No Direct Asset Links

* Photo URLs in the database are internal Cloudinary `public\\\_id` references
* Browser never sees a stable permanent Cloudinary URL
* All rendering goes through Next.js `<Image>` with the Cloudinary loader

### 7.8 CSS Selection Disable

```css
img, .photo-overlay {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
```

\---

## 8\. Admin Panel

### 8.1 Authentication

* Supabase Auth: email + password + TOTP 2FA (Google Authenticator / Authy) -- login rejected without valid TOTP
* Session expires after 8 hours of inactivity
* Max 5 failed login attempts triggers 15-minute lockout
* All `/admin` routes protected via Next.js middleware
* `/admin` excluded from sitemap and robots.txt

### 8.2 Photo Upload Flow

1. Admin selects files (JPG, PNG, TIFF, HEIC; max 50MB per file)
2. Upload progress shown
3. File uploaded to private Supabase Storage bucket
4. Cloudinary upload triggered server-side (display version + auto-tagging)
5. Cloudinary tags passed to `/api/seo-suggest` → Claude API returns multilingual suggestions
6. Admin reviews pre-filled form per photo:

   * Title, description, alt text (6 languages, pre-filled)
   * Behind the lens text (6 languages, free text)
   * Location (city, country)
   * Mood/vibe tags (multi-select, pre-suggested)
   * Collection assignment (multi-select)
   * Camera metadata (optional)
   * Edition size (integer, leave blank for open edition)
   * "Available for license" toggle
   * "Featured" toggle (hero carousel)
   * Visibility toggle (draft / published)
7. On save, record created in `photos` table

### 8.3 Photo Management

* Grid view of all photos (published + drafts)
* Side panel edit on click
* Toggle visibility, featured status
* Delete with confirmation (removes from Cloudinary + Supabase Storage)
* Drag-and-drop reorder within collections and main grid
* Edition max: editable number field (admin can increase at any time)
* Bulk publish, unpublish, delete

### 8.4 Hero Carousel Management

* "Featured / Hero Photos" section in dashboard
* Shows all photos with Featured toggle active
* Drag-and-drop to set carousel sequence
* Maximum 6 featured photos enforced with UI warning

### 8.5 Messages Inbox + Order Management

* All contact form submissions, newest first
* Status badges: Unread | Read | Awaiting Payment | Paid | Fulfilled | Archived
* Click to expand full message
* Admin workflow:

  1. Read message, mark as Read
  2. Reply via own email client
  3. On payment received: click "Mark as Paid"
  4. System automatically:

     * Decrements `edition\\\_sold` by 1 for relevant photo(s)
     * Generates a signed 5-day download token
     * Emails the buyer via Resend with the download link and license terms summary
     * Sets message status to "Fulfilled"
  5. If link expires: admin clicks "Resend Download Link" to generate a new 5-day token and email it
* Delete message removes all personal data (GDPR)

\---

## 9\. Download Link System

* On "Mark as Paid", server generates a unique signed token stored in `download\\\_tokens`:

  * Associated `photo\\\_id` and `message\\\_id`
  * Buyer email
  * Expiry: `now() + 5 days`
  * `invalidated` boolean (set to true when a replacement is issued)
* Download URL: `https://\\\[domain]/api/download/\\\[token]`
* On access: API validates token (exists, not expired, not invalidated), generates a short-lived Supabase Storage signed URL for the original file, and redirects the buyer to it
* Original file is never directly linked -- always proxied through the API
* Expired token shows a friendly error page with instructions to contact the photographer
* "Resend Download Link" invalidates the old token and generates a fresh one

\---

## 10\. Database Schema (Supabase / PostgreSQL)

### `photos`

```sql
id                    UUID PRIMARY KEY DEFAULT gen\\\_random\\\_uuid()
cloudinary\\\_id         TEXT NOT NULL
storage\\\_path          TEXT NOT NULL
order\\\_index           INTEGER DEFAULT 0
published             BOOLEAN DEFAULT false
featured              BOOLEAN DEFAULT false
available\\\_for\\\_license BOOLEAN DEFAULT false
edition\\\_max           INTEGER NULL
edition\\\_sold          INTEGER DEFAULT 0
created\\\_at            TIMESTAMPTZ DEFAULT now()
updated\\\_at            TIMESTAMPTZ DEFAULT now()
```

### `photo\\\_translations`

```sql
id           UUID PRIMARY KEY DEFAULT gen\\\_random\\\_uuid()
photo\\\_id     UUID REFERENCES photos(id) ON DELETE CASCADE
locale       TEXT NOT NULL    -- 'en'|'pt'|'es'|'fr'|'it'|'de'
title        TEXT NOT NULL
description  TEXT
alt\\\_text     TEXT
behind\\\_lens  TEXT
location     TEXT
UNIQUE(photo\\\_id, locale)
```

### `photo\\\_metadata`

```sql
photo\\\_id      UUID PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE
camera\\\_body   TEXT
lens          TEXT
focal\\\_length  TEXT
aperture      TEXT
iso           INTEGER
shutter\\\_speed TEXT
```

### `photo\\\_moods`

```sql
photo\\\_id UUID REFERENCES photos(id) ON DELETE CASCADE
mood     TEXT NOT NULL
PRIMARY KEY (photo\\\_id, mood)
```

### `collections`

```sql
id          UUID PRIMARY KEY DEFAULT gen\\\_random\\\_uuid()
slug        TEXT UNIQUE NOT NULL
cover\\\_photo UUID REFERENCES photos(id)
order\\\_index INTEGER DEFAULT 0
published   BOOLEAN DEFAULT false
created\\\_at  TIMESTAMPTZ DEFAULT now()
```

### `collection\\\_translations`

```sql
collection\\\_id UUID REFERENCES collections(id) ON DELETE CASCADE
locale        TEXT NOT NULL
name          TEXT NOT NULL
description   TEXT
PRIMARY KEY (collection\\\_id, locale)
```

### `collection\\\_photos`

```sql
collection\\\_id UUID REFERENCES collections(id) ON DELETE CASCADE
photo\\\_id      UUID REFERENCES photos(id) ON DELETE CASCADE
order\\\_index   INTEGER DEFAULT 0
PRIMARY KEY (collection\\\_id, photo\\\_id)
```

### `messages`

```sql
id              UUID PRIMARY KEY DEFAULT gen\\\_random\\\_uuid()
name            TEXT NOT NULL
email           TEXT NOT NULL
subject         TEXT NOT NULL
photos\\\_interest TEXT
intended\\\_use    TEXT
message         TEXT NOT NULL
ip\\\_hash         TEXT
status          TEXT DEFAULT 'unread'
created\\\_at      TIMESTAMPTZ DEFAULT now()
```

### `download\\\_tokens`

```sql
id          UUID PRIMARY KEY DEFAULT gen\\\_random\\\_uuid()
message\\\_id  UUID REFERENCES messages(id) ON DELETE CASCADE
photo\\\_id    UUID REFERENCES photos(id)
email       TEXT NOT NULL
token       TEXT UNIQUE NOT NULL
expires\\\_at  TIMESTAMPTZ NOT NULL
invalidated BOOLEAN DEFAULT false
created\\\_at  TIMESTAMPTZ DEFAULT now()
```

\---

## 11\. i18n Implementation

* `next-intl` with App Router, `app/\\\[locale]/` directory structure
* 6 locale files: `/messages/en.json`, `/messages/pt.json`, `/messages/es.json`, `/messages/fr.json`, `/messages/it.json`, `/messages/de.json`
* Translation keys: nav, hero, gallery, mood filters, lightbox, photo detail, behind-the-lens label, wall mockup, contact form, form validation, success messages, pricing, how it works, about, favorites, GDPR/cookie banner, admin labels
* Middleware detects browser locale on first visit and redirects to appropriate prefix
* Locale persisted in cookie for return visits
* Photo metadata served in active locale from `photo\\\_translations`; falls back to English if translation missing
* `hreflang` alternate links for all 6 locales on every page

\---

## 12\. SEO \& Performance

* `generateMetadata()` per page with localized title and meta description
* Canonical URLs set to locale-prefixed path
* `hreflang` alternate links for all 6 locales on every page
* `sitemap.xml` dynamically generated (excludes `/admin`, `/api`)
* `robots.txt`: disallows `/admin`, `/api`, allows all else
* Next.js `<Image>` with Cloudinary loader for all photos
* Lazy loading on gallery images below the fold
* Open Graph tags per photo page using a dedicated social preview transformation (1200x630, no watermark, lower res)
* Core Web Vitals target: LCP < 2.5s, CLS < 0.1

\---

## 13\. Design System

**Aesthetic:** Dark, editorial, cinematic. Atmosphere over decoration.
**Background:** Near-black (#0a0a0a -- not pure black)
**Text:** Off-white primary, mid-gray secondary
**Accent:** Single warm accent (muted gold or burnt amber) -- no gradients, no rainbow palette
**Typography:**

* Display / headings: `Cormorant Garamond` -- elegant, editorial, distinctive
* Body / UI: `Instrument Sans` -- clean, modern, readable at small sizes
* Loaded via `next/font` (Google Fonts, subsetted per locale)

**Motion:**

* Hero: Ken Burns effect per slide via Framer Motion
* Photo expand: `layoutId` shared layout animation with spring physics
* Page transitions: subtle fade via `AnimatePresence`
* Gallery load: staggered fade-in on scroll
* Wall mockup reveal: smooth CSS transition

**Mobile breakpoints:**

* Mobile: < 768px (1-column gallery)
* Tablet: 768-1024px (2-column gallery)
* Desktop: > 1024px (3-4 column masonry)

\---

## 14\. Environment Variables

```
# Supabase
NEXT\\\_PUBLIC\\\_SUPABASE\\\_URL=
NEXT\\\_PUBLIC\\\_SUPABASE\\\_ANON\\\_KEY=
SUPABASE\\\_SERVICE\\\_ROLE\\\_KEY=

# Cloudinary
NEXT\\\_PUBLIC\\\_CLOUDINARY\\\_CLOUD\\\_NAME=
CLOUDINARY\\\_API\\\_KEY=
CLOUDINARY\\\_API\\\_SECRET=
CLOUDINARY\\\_WATERMARK\\\_PUBLIC\\\_ID=

# Claude API
ANTHROPIC\\\_API\\\_KEY=

# Resend
RESEND\\\_API\\\_KEY=
RESEND\\\_FROM\\\_EMAIL=
ADMIN\\\_NOTIFICATION\\\_EMAIL=

# hCaptcha
NEXT\\\_PUBLIC\\\_HCAPTCHA\\\_SITE\\\_KEY=
HCAPTCHA\\\_SECRET\\\_KEY=

# App
NEXT\\\_PUBLIC\\\_SITE\\\_URL=
DOWNLOAD\\\_TOKEN\\\_SECRET=
```

\---

## 15\. Out of Scope (v1.0)

* Payment processing / e-commerce (inquiry + manual payment confirmation only)
* Automated print fulfillment
* Blog or editorial section
* Analytics dashboard in admin
* Social media auto-posting
* Video support
* Buyer accounts
* Mailing list / newsletter
* In-app reply to messages

\---

## 16\. Acceptance Criteria Summary

|Feature|Acceptance Criteria|
|-|-|
|Hero carousel|5-6 featured photos cycle with Ken Burns effect; admin manages selection and order|
|Homepage grid|Paginated 24/page masonry; mood filters work; new drop badge appears|
|Collections|Dropdown nav lists all collections; each has its own page and intro|
|Lightbox|Shared layout expand/collapse animation; keyboard + swipe nav works|
|Wall mockup|Toggle reveals photo composited on wall scene|
|Behind the lens|Appears on photo page when field is populated|
|Favorites|Heart toggle persists in localStorage; pre-fills contact form|
|Limited editions|Counter shown on card and photo page; decrements automatically on "Mark as Paid"|
|Photo upload|Master stored privately; display version auto-generated via Cloudinary|
|SEO pipeline|Cloudinary tags → Claude API → multilingual suggestions pre-fill upload form|
|Dynamic URLs|Cloudinary URLs are signed and expire; no stable asset links in HTML|
|Admin login|2FA required; lockout after 5 failed attempts|
|Contact form|hCaptcha + honeypot + GDPR checkbox; stored in DB; email sent to admin; rate-limited|
|Mark as paid|Decrements edition counter; sends buyer a 5-day signed download link via email|
|Download link|Token validated server-side; original file proxied through API, never directly linked|
|Resend link|Admin can regenerate and resend an expired download link|
|Pricing page|Three tiers in EUR; payment methods listed; Bizum footnoted as Spain-only|
|i18n|All 6 locales route correctly; photo metadata served in active locale|
|GDPR|Cookie consent banner; privacy policy page; data deletion path in admin|
|Mobile|All public pages pass mobile usability; touch gestures work in lightbox|
|SEO|sitemap.xml generated; hreflang set; /admin excluded from indexing|



