import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Cancionero",
    short_name: "Cancionero",
    description: "Eventos, setlists, acordes y chat para equipos de alabanza y bandas.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f1012",
    theme_color: "#0f1012",
    categories: ["music", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nuevo evento", url: "/eventos/nuevo", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Canciones", url: "/canciones", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Chats", url: "/chats", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
