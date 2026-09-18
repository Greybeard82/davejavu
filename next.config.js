const createNextIntlPlugin = require("next-intl/plugin");

// Applied to every response.
const baseSecurityHeaders = [
  // Two years, subdomains included. Only ever honoured over HTTPS, so this is
  // inert on a local build.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Enforcing clickjacking protection.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
