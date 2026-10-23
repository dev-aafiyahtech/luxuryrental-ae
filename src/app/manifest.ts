import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LuxuryRental.ae",
    short_name: "LuxuryRental",
    description: "Luxury car rental in Dubai, delivered.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#0c0a09",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
