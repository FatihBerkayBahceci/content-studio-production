/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Enable transpiling for shared workspace packages
  transpilePackages: ['@seo-tool-suite/shared'],

  // Image optimization
  images: {
    domains: [],
  },

  // Environment variables available at build time
  env: {
    APP_NAME: 'SEO Tool Suite',
    APP_VERSION: '1.0.0',
  },

  // Redirects and rewrites can be added here
  async redirects() {
    return [];
  },

  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
