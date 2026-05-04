import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  // @ts-expect-error - eslint is a valid NextConfig property
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
