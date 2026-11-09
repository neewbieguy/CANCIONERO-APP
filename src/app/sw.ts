/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // No saltamos la espera: mostramos "Nueva versión disponible" y el usuario decide.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Canciones y eventos ya abiertos quedan disponibles sin conexión (uso en el escenario).
    {
      matcher: ({ url, request }) =>
        request.mode === "navigate" && /^\/(canciones|eventos)\/[^/]+/.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "cancionero-stage",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/icons/"),
      handler: new CacheFirst({ cacheName: "cancionero-icons" }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

// ---- Web Push ----
self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; link?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "Cancionero", body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Cancionero", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { link: data.link ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link: string = event.notification.data?.link ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients[0] as WindowClient | undefined;
      if (existing) {
        void existing.navigate(link);
        return existing.focus();
      }
      return self.clients.openWindow(link);
    }),
  );
});

serwist.addEventListeners();
