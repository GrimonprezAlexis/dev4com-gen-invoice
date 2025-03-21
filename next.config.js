/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  swcMinify: false, // Disable SWC minification to avoid the setBlocking error
  webpack: (config, { isServer }) => {
    // Avoid process.stdout issues in WebContainer
    if (!isServer) {
      config.optimization.minimize = false;
    }
    return config;
  }
};

module.exports = nextConfig;