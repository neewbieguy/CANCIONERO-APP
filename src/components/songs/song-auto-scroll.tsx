"use client";

import { useState } from "react";
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "@/lib/song-prefs";
import { basePxPerSec, useAutoScroll, useScrollSpeed } from "./auto-scroll";
import { SheetBar, nearestZoom } from "./sheet-bar";
import { useSongPrefs } from "./song-prefs";

/** Tamaño de letra (px) que corresponde a 1× en la pantalla de la canción. */
export const SONG_BASE_FONT = 16;

/**
 * Barra flotante de la pantalla de la canción: zoom de la letra y desplazamiento automático.
 * El zoom usa la misma preferencia "tamaño de letra" del modal de Preferencias.
 */
export function SongAutoScroll({ bpm }: { bpm: number | null }) {
  const { prefs, setPref } = useSongPrefs();
  const scroll = useScrollSpeed();
  const [playing, setPlaying] = useState(false);

  useAutoScroll({
    target: "window",
    playing,
    pxPerSec: basePxPerSec(bpm) * scroll.speed,
    onStop: () => setPlaying(false),
  });

  return (
    <SheetBar
      zoom={nearestZoom(prefs.fontSize / SONG_BASE_FONT)}
      onZoom={(z) => setPref("fontSize", Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(z * SONG_BASE_FONT))))}
      playing={playing}
      onPlayingChange={setPlaying}
      scroll={scroll}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 md:bottom-6 md:left-[calc(50%+36px)]"
    />
  );
}
