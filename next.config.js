const createNextIntlPlugin = require("next-intl/plugin");

// ---------------------------------------------------------------------------
// Content-Security-Policy
//
// Shipped in Report-Only mode. A wrong CSP breaks checkout silently: PayPal
// mounts its buttons in a cross-origin iframe and pulls several scripts, so a
// missing origin means the buy flow simply does not appear. Report-Only logs
// every violation to the browser console and changes nothing.
//
// To promote it to enforcing, once the console has been clean for a few days
// across the homepage, a photo page, the basket, checkout and the contact
// form: rename the header below from
//   Content-Security-Policy-Report-Only   to   Content-Security-Policy
// and redeploy. Nothing else changes. Revert the rename to back it out.
//
// Origins, and why each one is here:
//   res.cloudinary.com      every displayed image
//   api.cloudinary.com      direct upload from the admin panel
//   *.paypal.com            the SDK, its iframes and its fraud signals
//   *.paypalobjects.com     PayPal's own static assets
//   *.hcaptcha.com          the contact form captcha widget and its iframe
//   <Supabase project>      every database and auth call, https and websocket
//   va.vercel-scripts.com   Vercel Analytics, when not served same-origin
//
// Google Fonts is deliberately absent: next/font/google downloads Montserrat
// at build time and serves it from this origin, so no external font host is
// contacted at runtime.
//
// 'unsafe-inline' in script-src is required by the App Router, which inlines
// its hydration bootstrap. Removing it needs nonce plumbing through the root
// layout, which is a bigger change than this branch should make.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_WS = SUPABASE_URL.replace(/^https:/, 'wss:');

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com https://hcaptcha.com https://*.hcaptcha.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.paypal.com https://*.paypalobjects.com https://*.hcaptcha.com",
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_WS} https://api.cloudinary.com https://res.cloudinary.com https://*.paypal.com https://hcaptcha.com https://*.hcaptcha.com https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
  "frame-src 'self' https://*.paypal.com https://hcaptcha.com https://*.hcaptcha.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
]
  .join('; ')
  .replace(/\s+/g, ' ')
  .trim();

// Applied to every response.
const baseSecurityHeaders = [
  // Two years, subdomains included. Only ever honoured over HTTPS, so this is
  // inert on a local build.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Enforcing clickjacking protection. frame-ancestors above says the same
  // thing but is Report-Only for now, so this header is what actually holds.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.68.107'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: baseSecurityHeaders,
      },
      {
        // API responses carry order state, download links and admin data.
        // None of it may sit in a shared or browser cache.
        source: '/api/:path*',
        headers: [
          ...baseSecurityHeaders,
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = createNextIntlPlugin()(nextConfig);
