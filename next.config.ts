import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  // The car share images read fonts, the wordmark and the car's card image from disk.
  outputFileTracingIncludes: {
    "/[lang]/cars/[brand]/[model]/opengraph-image": ["./assets/fonts/**", "./public/brand/logo-horizontal-white.svg", "./public/cars/*/card.*.webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
