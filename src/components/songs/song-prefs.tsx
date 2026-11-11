"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { SongPrefs } from "@/lib/song-prefs";
import { saveSongPrefs } from "@/server/actions/settings";

type SongPrefsValue = {
  prefs: SongPrefs;
  setPref: <K extends keyof SongPrefs>(key: K, value: SongPrefs[K]) => void;
};

const SongPrefsContext = createContext<SongPrefsValue | null>(null);

export function useSongPrefs() {
  const ctx = useContext(SongPrefsContext);
  if (!ctx) throw new Error("useSongPrefs debe usarse dentro de <SongPrefsProvider>");
  return ctx;
}

/**
 * Preferencias de lectura del usuario. Se aplican al instante y se guardan
 * en su cuenta un momento después (así lo siguen en cualquier dispositivo).
 */
export function SongPrefsProvider({ initial, children }: { initial: SongPrefs; children: React.ReactNode }) {
  const [prefs, setPrefs] = useState(initial);
  const pending = useRef<SongPrefs | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const flush = useCallback(() => {
    const toSave = pending.current;
    if (!toSave) return;
    pending.current = null;
    void saveSongPrefs(toSave)
      .then((res) => {
        if (!res.ok) toast.error("No se pudieron guardar tus preferencias");
      })
      .catch(() => toast.error("No se pudieron guardar tus preferencias"));
  }, []);

  const setPref = useCallback(
    <K extends keyof SongPrefs>(key: K, value: SongPrefs[K]) => {
      setPrefs((p) => {
        const next = { ...p, [key]: value };
        pending.current = next;
        return next;
      });
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [flush],
  );

  // Si se sale de la página antes de que se guarde, guardar igual
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      flush();
    },
    [flush],
  );

  const value = useMemo(() => ({ prefs, setPref }), [prefs, setPref]);
  return <SongPrefsContext.Provider value={value}>{children}</SongPrefsContext.Provider>;
}

/** Muestra su contenido solo si está activada la opción "Detalles de la canción". */
export function SongDetailsGate({ children }: { children: React.ReactNode }) {
  const { prefs } = useSongPrefs();
  return prefs.showDetails ? <>{children}</> : null;
}
