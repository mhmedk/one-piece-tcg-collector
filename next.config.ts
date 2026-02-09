import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "en.onepiece-cardgame.com",
      },
    ],
  },
};

export default nextConfig;
