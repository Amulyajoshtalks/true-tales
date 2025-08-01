// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // ✅ allow Google avatars
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [{ key: 'Accept-Ranges', value: 'bytes' }],
      },
    ];
  },
};

module.exports = nextConfig;
