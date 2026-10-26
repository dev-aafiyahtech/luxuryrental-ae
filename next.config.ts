import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  // The team desk moved from /demo/ops to /ops (26 Oct 2026); keep old links working.
  async redirects() {
    return [
      { source: "/demo", destination: "/ops", permanent: true },
      { source: "/demo/ops", destination: "/ops", permanent: true },
      { source: "/demo/widgets", destination: "/ops/widgets", permanent: true },
      { source: "/ar/demo", destination: "/ar/ops", permanent: true },
      { source: "/ar/demo/ops", destination: "/ar/ops", permanent: true },
      { source: "/ar/demo/widgets", destination: "/ar/ops/widgets", permanent: true },
    ];
  },
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
