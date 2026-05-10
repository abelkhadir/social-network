import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Social Network",
    short_name: "Social",
    description: "Connect, discuss, and chat with your community.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/img/social-network.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
