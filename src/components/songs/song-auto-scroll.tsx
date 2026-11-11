"use client";

import { useEffect, useState } from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { basePxPerSec, formatSpeed, useAutoScroll, useScrollSpeed } from "./auto-scroll";
import { useSongView } from "./song-view";

/**
 * Barra flotante del desplazamiento automático en la pantalla de la canción.
 * Aparece al activar el botón de flechas de la cápsula de acciones.
 */
export function SongAutoScroll({ bpm }: { bpm: number | null }) {
  const { autoScroll, setAutoScroll } = useSongView();
  const { speed, slower, faster, canSlower, canFaster } = useScrollSpeed();
  const [playing, setPlaying] = useState(false);

  // Al apagar el botón se oculta la barra y se frena
  useEffect(() => {
    if (!autoScroll) setPlaying(false);
  }, [autoScroll]);

  useAutoScroll({
    target: "window",
    playing,
    pxPerSec: basePxPerSec(bpm) * speed,
    onStop: () => setPlaying(false),
  });

  if (!autoScroll) return null;

  return (
    <div
      role="toolbar"
      aria-label="Desplazamiento automático"
      onKeyDown={(e) => e.key === "Escape" && setAutoScroll(false)}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card/95 p-1.5 shadow-lg backdrop-blur animate-in fade-in-0 slide-in-from-bottom-2 md:bottom-6 md:left-[calc(50%+36px)]"
    >
      <Button variant="ghost" size="icon" className="rounded-full" onClick={slower} disabled={!canSlower} aria-label="Más lento">
        <Minus />
      </Button>
      <span className="min-w-12 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite" aria-label={`Velocidad ${formatSpeed(speed)}`}>
        {formatSpeed(speed)}
      </span>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={faster} disabled={!canFaster} aria-label="Más rápido">
        <Plus />
      </Button>
      <Button className="ml-1 min-w-32 rounded-full" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
        {playing ? <Pause /> : <Play />}
        {playing ? "Pausar" : "Reproducir"}
      </Button>
    </div>
  );
}
