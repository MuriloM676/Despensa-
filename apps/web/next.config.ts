import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@despensa/database", "@despensa/types", "@despensa/ui"],
  serverExternalPackages: ["@prisma/adapter-pg", "pg", "prisma"],
};

export default nextConfig;
