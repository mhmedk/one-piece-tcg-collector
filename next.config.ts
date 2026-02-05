import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.optcgapi.com",
      },
      {
        protocol: "https",
        hostname: "en.onepiece-cardgame.com",
      },
    ],
  },
};

export default nextConfig;
