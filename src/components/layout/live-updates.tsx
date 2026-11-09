"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const REALTIME_EVENT = "cancionero:realtime";

/**
 * Mantiene una conexión SSE por pestaña. Reenvía cada evento como CustomEvent
 * en window y refresca los datos del servidor cuando hace falta.
 */
export function LiveUpdates({ teamId }: { teamId: string }) {
  const router = useRouter();

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
        let data: { type: string };
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }
        if (data.type === "ping") return;
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: data }));
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
