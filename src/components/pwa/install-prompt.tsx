"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cancionero:install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  };

  return { canInstall: Boolean(deferred), installed, isIOS, install };
}

/** Aviso discreto para instalar la app (dashboard). */
export function InstallBanner({ className }: { className?: string }) {
  const { canInstall, installed, isIOS, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (installed || dismissed || (!canInstall && !isIOS)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* almacenamiento no disponible */
    }
  };

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 pl-4", className)}>
      <Download className="h-5 w-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm">
        {isIOS && !canInstall ? (
          <>
            Instalá Cancionero: tocá <Share className="inline h-4 w-4" /> y luego{" "}
            <strong>“Añadir a pantalla de inicio”</strong>.
          </>
        ) : (
          "Instalá Cancionero para usarlo como una app, incluso sin conexión."
        )}
      </p>
      {canInstall && (
        <Button size="sm" onClick={install}>
          Instalar
        </Button>
      )}
      <Button size="icon-sm" variant="ghost" onClick={dismiss} aria-label="Cerrar">
        <X />
      </Button>
    </div>
  );
}
