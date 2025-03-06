import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    newDevOverlay: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "pub-b5761d391b8e432d8bd81d34d560efb8.r2.dev",
      "media.etudofresco.com.br",
    ],
  },
};

export default nextConfig;
