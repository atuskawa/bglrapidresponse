import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BGLRR - Barangay Greater Lagro Rapid Response",
    short_name: "BGLRR",
    description: "Barangay Greater Lagro resident rapid response app",
    start_url: "/resident/login",
    scope: "/resident/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#254a91",
    icons: [
      { src: "/icon512_rounded.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon512_maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
