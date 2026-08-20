import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@livekit/components-react', '@livekit/components-styles'],
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
