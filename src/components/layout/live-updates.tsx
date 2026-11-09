"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export const REALTIME_EVENT = "cancionero:realtime";

/**
 * Mantiene una conexión SSE por pestaña. Reenvía cada evento como CustomEvent
 * en window (lo usan los chats) y refresca los datos del servidor cuando hace falta.
 */
export function LiveUpdates({ teamId }: { teamId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const refreshSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };

    const connect = () => {
      es = new EventSource(`/api/stream?teamId=${encodeURIComponent(teamId)}`);
      es.onmessage = (e) => {
        let data: { type: string; channelId?: string };
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }
        if (data.type === "ping") return;
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: data }));
        // En la pantalla de chats, el propio chat maneja los mensajes nuevos.
        if (data.type === "message" && pathRef.current.startsWith("/chats")) return;
        refreshSoon();
      };
      es.onerror = () => {
        es?.close();
        if (!closed) retry = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      clearTimeout(retry);
      es?.close();
    };
  }, [teamId, router]);

  return null;
}
