"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { BellOff, BellRing, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { sendTestPush, subscribePush, unsubscribePush } from "@/server/actions/push";

type Status =
  | "loading"
  | "unsupported" // el navegador no soporta push
  | "ios-install" // iPhone/iPad: hay que instalar la app primero
  | "no-sw" // sin service worker (modo desarrollo)
  | "denied" // el usuario bloqueó las notificaciones
  | "off"
  | "on";

/** Convierte la clave pública VAPID (base64url) al formato que pide pushManager. */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function PushSettings({ publicKey }: { publicKey: string | null }) {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, start] = useTransition();

  const refresh = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return setStatus(isIos() && !isStandalone() ? "ios-install" : "unsupported");
    }
    if (Notification.permission === "denied") return setStatus("denied");
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return setStatus("no-sw");
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub ? "on" : "off");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = () =>
    start(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("No diste permiso para las notificaciones");
          return void refresh();
        }
        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey!) }));
        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        const res = await subscribePush({ endpoint: json.endpoint, keys: json.keys });
        if (!res.ok) {
          await sub.unsubscribe().catch(() => {});
          toast.error(res.error);
        } else toast.success("Notificaciones activadas en este dispositivo");
      } catch {
        toast.error("No se pudieron activar las notificaciones");
      }
      void refresh();
    });

  const disable = () =>
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        toast.success("Notificaciones desactivadas en este dispositivo");
      } catch {
        toast.error("No se pudieron desactivar");
      }
      void refresh();
    });

  if (!publicKey) {
    return <Note icon={BellOff} text="Las notificaciones push no están configuradas en el servidor (faltan las claves VAPID)." />;
  }
  if (status === "loading") return <div className="h-12 animate-pulse rounded-xl bg-muted/40" />;
  if (status === "unsupported") return <Note icon={BellOff} text="Este navegador no soporta notificaciones push." />;
  if (status === "ios-install")
    return (
      <Note
        icon={BellOff}
        text='En iPhone o iPad primero instalá la app: tocá Compartir → "Agregar a pantalla de inicio", abrila desde el ícono y volvé a esta pantalla.'
      />
    );
  if (status === "no-sw")
    return (
      <Note
        icon={BellOff}
        text="Las notificaciones push funcionan con la versión de producción de la app (npm run build && npm start, o ya publicada). En modo desarrollo no están disponibles."
      />
    );
  if (status === "denied")
    return (
      <Note
        icon={BellOff}
        text="Bloqueaste las notificaciones para Cancionero. Habilitalas desde la configuración del navegador (el candado junto a la dirección) y recargá la página."
      />
    );

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="flex items-center gap-3">
          <BellRing className="h-5 w-5 text-primary" />
          <span>
            <span className="block text-sm font-medium">Notificaciones en este dispositivo</span>
            <span className="block text-xs text-muted-foreground">
              Asignaciones, cambios en eventos y nuevos miembros.
            </span>
          </span>
        </span>
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Switch checked={status === "on"} onCheckedChange={(v) => (v ? enable() : disable())} />
        )}
      </label>
      {status === "on" && (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await sendTestPush();
              if (!res.ok) toast.error(res.error);
              else toast.success("Enviada. Debería llegarte en unos segundos.");
            })
          }
        >
          <Send /> Enviar notificación de prueba
        </Button>
      )}
    </div>
  );
}

function Note({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <p className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      {text}
    </p>
  );
}
