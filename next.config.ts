import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "splzhikuvhxalnttksqz.supabase.co",
      },
    ],
  },
};

export default nextConfig;
