import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.appName,
    short_name: config.appName,
    description: "Audiobooks por assinatura",
    start_url: "/biblioteca",
    display: "standalone",
    background_color: "#f6f2ea",
    theme_color: "#1f5c58",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
