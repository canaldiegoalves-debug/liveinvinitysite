import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  // @ts-ignore - eslint is a valid NextConfig property
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
