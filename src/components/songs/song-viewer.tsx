"use client";

import { useEffect, useState } from "react";
import { SHEET_FONTS } from "@/lib/song-prefs";
import { nearestZoom } from "./sheet-bar";
import { SongSections } from "./song-sections";
import { useSongPrefs } from "./song-prefs";
import { useSongView } from "./song-view";

const PREFS_KEY = "cancionero:sheet-prefs";
/** Tamaño de letra (px) que corresponde a 1× en el Modo Atril. */
export const STAGE_BASE_FONT = 22;

/** Preferencias de lectura del Modo Atril, guardadas en este dispositivo (zoom, acordes, columnas). */
export function useSheetPrefs() {
  const [zoom, setZoom] = useState(1);
  const [showChords, setShowChords] = useState(true);
  const [twoColumns, setTwoColumns] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
      if (saved && typeof saved.zoom === "number") setZoom(nearestZoom(saved.zoom));
      // Antes se guardaba el tamaño en px
      else if (saved && typeof saved.fontSize === "number") setZoom(nearestZoom(saved.fontSize / STAGE_BASE_FONT));
      if (saved && typeof saved.twoColumns === "boolean") setTwoColumns(saved.twoColumns);
      if (saved && typeof saved.showChords === "boolean") setShowChords(saved.showChords);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ zoom, showChords, twoColumns }));
    } catch {}
  }, [zoom, showChords, twoColumns, loaded]);

  return { zoom, setZoom, showChords, setShowChords, twoColumns, setTwoColumns };
}

/** Hoja de letra y acordes. El tono y la cejilla vienen de <SongViewProvider>; la vista, de las preferencias. */
export function SongViewer({ source }: { source: string }) {
  const { sheetSemitones, sheetKey } = useSongView();
  const { prefs } = useSongPrefs();
  const font = SHEET_FONTS.find((f) => f.value === prefs.font) ?? SHEET_FONTS[0];

  return (
    <SongSections
      source={source}
      semitones={sheetSemitones}
      targetKey={sheetKey}
      mode={prefs.view}
      notation={prefs.notation}
      compact={prefs.compact}
      columns={prefs.twoColumns}
      fontSize={prefs.fontSize}
      // Lugar para la barra flotante de abajo
      className={`${font.className} pb-16`}
    />
  );
}
