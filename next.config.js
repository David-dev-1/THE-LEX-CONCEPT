/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    minimumCacheTTL: 31536000, // uploaded images never change, so cache them for a year
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    return [
      {
        // Locally-stored uploads are filenamed with a timestamp + random
        // suffix, so they're effectively immutable - safe to cache hard.
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
