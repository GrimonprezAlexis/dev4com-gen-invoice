/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enlever output: 'export' pour permettre les routes API dynamiques
  // output: 'export' n'est pas compatible avec les routes API dynamiques comme generate-quote-content
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  swcMinify: false, // Disable SWC minification to avoid the setBlocking error
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config, { isServer }) => {
    // Avoid process.stdout issues in WebContainer
    if (!isServer) {
      config.optimization.minimize = false;
    }
    // Force firebase/auth to use browser version
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,
    };
    // Exclude undici from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  }
};

module.exports = nextConfig;