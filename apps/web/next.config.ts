import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // packages/ui ships raw TSX (see its package.json — main points straight
  // at src/index.ts, no build step), so Next needs to transpile it itself
  // rather than treating it as pre-compiled node_modules code.
  transpilePackages: ["@navicore/ui"],
};

export default nextConfig;
