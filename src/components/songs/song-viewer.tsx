"use client";

import { useEffect, useState } from "react";
import { SHEET_FONTS } from "@/lib/song-prefs";
import { ChordSheet } from "./chord-sheet";
import { useSongPrefs } from "./song-prefs";
import { useSongView } from "./song-view";

const PREFS_KEY = "cancionero:sheet-prefs";
export const FONT_MIN = 12;
export const FONT_MAX = 40;

/** Preferencias de lectura guardadas en este dispositivo (tamaño y acordes visibles). */
export function useSheetPrefs(defaultSize: number) {
  const [fontSize, setFontSize] = useState(defaultSize);
  const [showChords, setShowChords] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
      if (saved && typeof saved.fontSize === "number") setFontSize(Math.min(FONT_MAX, Math.max(FONT_MIN, saved.fontSize)));
      if (saved && typeof saved.showChords === "boolean") setShowChords(saved.showChords);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ fontSize, showChords }));
    } catch {}
  }, [fontSize, showChords, loaded]);

  return { fontSize, setFontSize, showChords, setShowChords };
}

/** Hoja de letra y acordes. El tono y la cejilla vienen de <SongViewProvider>; la vista, de las preferencias. */
export function SongViewer({ source }: { source: string }) {
  const { sheetSemitones, sheetKey } = useSongView();
  const { prefs } = useSongPrefs();
  const font = SHEET_FONTS.find((f) => f.value === prefs.font) ?? SHEET_FONTS[0];

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card p-4 md:p-6">
      <ChordSheet
        source={source}
        semitones={sheetSemitones}
        targetKey={sheetKey}
        mode={prefs.view}
        notation={prefs.notation}
        compact={prefs.compact}
        columns={prefs.twoColumns}
        fontSize={prefs.fontSize}
        className={font.className}
      />
    </div>
  );
}
