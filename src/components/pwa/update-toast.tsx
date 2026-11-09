"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Muestra "Nueva versión disponible" cuando hay un service worker esperando. */
export function UpdateToast() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reloading = false;

    const prompt = (worker: ServiceWorker) => {
      toast("Nueva versión disponible", {
        description: "Actualizá para usar la última versión de Cancionero.",
        duration: Infinity,
        action: { label: "Actualizar", onClick: () => worker.postMessage({ type: "SKIP_WAITING" }) },
      });
    };

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      if (reg.waiting && navigator.serviceWorker.controller) prompt(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) prompt(installing);
        });
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
