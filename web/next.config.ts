import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conditionally enable static export only for build
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: false,
  }),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      }
    ]
  }
};

export default nextConfig;
