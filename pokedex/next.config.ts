import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.pokemon.com" },
      { protocol: "https", hostname: "raw.githububsercontent.com"},
    ],
  },
};

export default nextConfig;
