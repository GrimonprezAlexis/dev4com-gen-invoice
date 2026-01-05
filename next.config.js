/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enlever output: 'export' pour permettre les routes API dynamiques
  // output: 'export' n'est pas compatible avec les routes API dynamiques comme generate-quote-content
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