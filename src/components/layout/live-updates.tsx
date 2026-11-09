"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 30_000;

/**
 * Mantiene los datos al día sin conexión permanente (funciona en Vercel):
 * refresca cada 30 segundos mientras la pestaña está visible, y al volver a ella.
 */
export function LiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let last = Date.now();

    const refresh = () => {
      last = Date.now();
      router.refresh();
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => document.visibilityState === "visible" && refresh(), INTERVAL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Al volver a la app, si pasó un rato, traemos lo nuevo enseguida
      if (Date.now() - last > 10_000) refresh();
      start();
    };

    start();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  return null;
}
