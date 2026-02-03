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
    ],
  },
};

export default nextConfig;
