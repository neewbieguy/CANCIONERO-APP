"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { isMinorKey, semitonesBetween, transposeKey } from "@/lib/music/transpose";

export const CAPO_MAX = 11;

type SongView = {
  /** Tono con el que está guardada la canción (null si no se cargó). */
  originalKey: string | null;
  /** Tono en el que suena ahora, con la escritura que eligió el usuario ("D#", "Eb", "F#m"). */
  currentKey: string | null;
  /** Semitonos respecto del original (-5..+6). */
  semitones: number;
  capo: number;
  /** Lo que hay que pasarle a la hoja: los acordes que se tocan con la cejilla puesta. */
  sheetSemitones: number;
  sheetKey: string | undefined;
  /** Elige el tono por su nota ("D", "Bb", "F#"); mantiene mayor/menor del original. */
  setKeyRoot: (root: string) => void;
  /** Sube o baja de a medio tono (para canciones sin tono cargado). */
  shift: (n: number) => void;
  setCapo: (capo: number) => void;
  reset: () => void;
  /** Botón de desplazamiento automático encendido (muestra la barra flotante). */
  autoScroll: boolean;
  setAutoScroll: (on: boolean) => void;
};

const SongViewContext = createContext<SongView | null>(null);

export function useSongView() {
  const ctx = useContext(SongViewContext);
  if (!ctx) throw new Error("useSongView debe usarse dentro de <SongViewProvider>");
  return ctx;
}

/** Deja los semitonos en el rango -5..+6 (el camino más corto). */
const wrap = (n: number) => ((((n + 5) % 12) + 12) % 12) - 5;
const rootOf = (key: string) => /^[A-G][#b]?/.exec(key)?.[0] ?? key;

/**
 * Estado de lectura de una canción (tono y cejilla), compartido entre la
 * cápsula de acciones de la cabecera y la hoja de letra y acordes.
 */
export function SongViewProvider({
  originalKey,
  initialKey,
  children,
}: {
  originalKey: string | null;
  /** Tono con el que se abre (por ejemplo ?tono=A desde un setlist). */
  initialKey?: string | null;
  children: React.ReactNode;
}) {
  const suffix = originalKey && isMinorKey(originalKey) ? "m" : "";
  const startKey = originalKey ? (initialKey ? rootOf(initialKey) + suffix : originalKey) : null;

  const [currentKey, setCurrentKey] = useState<string | null>(startKey);
  const [rawSemitones, setRawSemitones] = useState(0);
  const [capo, setCapoState] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);

  const semitones = originalKey && currentKey ? semitonesBetween(originalKey, currentKey) : rawSemitones;

  const setKeyRoot = useCallback((root: string) => setCurrentKey(root + suffix), [suffix]);
  const shift = useCallback(
    (n: number) => {
      if (originalKey) setCurrentKey((k) => transposeKey(k ?? originalKey, n));
      else setRawSemitones((s) => wrap(s + n));
    },
    [originalKey],
  );
  const setCapo = useCallback((c: number) => setCapoState(Math.min(CAPO_MAX, Math.max(0, c))), []);
  const reset = useCallback(() => {
    setCurrentKey(originalKey);
    setRawSemitones(0);
  }, [originalKey]);

  const value = useMemo<SongView>(
    () => ({
      originalKey,
      currentKey,
      semitones,
      capo,
      sheetSemitones: semitones - capo,
      // Con cejilla se muestran las posiciones, escritas con el nombre habitual de ese tono
      sheetKey: currentKey ? (capo ? transposeKey(currentKey, -capo) : currentKey) : undefined,
      setKeyRoot,
      shift,
      setCapo,
      reset,
      autoScroll,
      setAutoScroll,
    }),
    [originalKey, currentKey, semitones, capo, setKeyRoot, shift, setCapo, reset, autoScroll],
  );

  return <SongViewContext.Provider value={value}>{children}</SongViewContext.Provider>;
}
