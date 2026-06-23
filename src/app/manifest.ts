import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kamker - Find Part Time Workers",
    short_name: "Kamker",
    description:
      "Find part time workers by category and city across Pakistan.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fbff",
    theme_color: "#1896d3",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Find Workers",
        short_name: "Workers",
        description: "Browse Kamker workers",
        url: "/professionals",
      },
      {
        name: "Categories",
        short_name: "Categories",
        description: "Browse service categories",
        url: "/categories",
      },
      {
        name: "Register",
        short_name: "Register",
        description: "Register on Kamker",
        url: "/register",
      },
    ],
  };
}
