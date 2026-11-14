"use client";

import { AArrowDown, AArrowUp, Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSpeed, type useScrollSpeed } from "./auto-scroll";

/** Niveles de zoom de la letra (1× es el tamaño base de cada pantalla). */
export const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Ej.: 1 -> "1×", 1.25 -> "1,25×" */
export function formatZoom(zoom: number) {
  return `${zoom.toLocaleString("es-AR", { maximumFractionDigits: 2 })}×`;
}

/** El nivel de zoom más cercano a un valor cualquiera. */
export function nearestZoom(value: number) {
  return ZOOM_STEPS.reduce((best, z) => (Math.abs(z - value) < Math.abs(best - value) ? z : best), ZOOM_STEPS[0] as number);
}

/**
 * Barra flotante de lectura (detalle de canción y Modo Atril):
 * zoom de la letra, velocidad y botón Reproducir del desplazamiento automático.
 */
export function SheetBar({
  zoom,
  onZoom,
  playing,
  onPlayingChange,
  scroll,
  className,
}: {
  zoom: number;
  onZoom: (zoom: number) => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  scroll: ReturnType<typeof useScrollSpeed>;
  className?: string;
}) {
  const index = ZOOM_STEPS.indexOf(nearestZoom(zoom) as (typeof ZOOM_STEPS)[number]);

  return (
    <div
      role="toolbar"
      aria-label="Tamaño de letra y desplazamiento automático"
      // En el atril, tocar la hoja pausa el desplazamiento: la barra no
      onClick={(e) => e.stopPropagation()}
      className={cn("z-30 flex max-w-[calc(100vw-1rem)] items-center gap-0.5 rounded-full border bg-card/95 p-1.5 shadow-lg backdrop-blur", className)}
    >
      {/* Zoom. En el celular deja su lugar a la velocidad mientras se reproduce. */}
      <div role="group" aria-label="Tamaño de letra" className={cn("items-center gap-0.5", playing ? "hidden sm:flex" : "flex")}>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => onZoom(ZOOM_STEPS[index - 1])} disabled={index <= 0} aria-label="Letra más chica">
          <AArrowDown />
        </Button>
        <span className="min-w-12 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite" aria-label={`Tamaño de letra ${formatZoom(ZOOM_STEPS[index])}`}>
          {formatZoom(ZOOM_STEPS[index])}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onZoom(ZOOM_STEPS[index + 1])}
          disabled={index >= ZOOM_STEPS.length - 1}
          aria-label="Letra más grande"
        >
          <AArrowUp />
        </Button>
      </div>

      <span className={cn("mx-1 h-5 w-px bg-border", playing ? "hidden sm:block" : "hidden")} aria-hidden />

      {/* Velocidad: aparece al reproducir */}
      {playing && (
        <div role="group" aria-label="Velocidad" className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={scroll.slower} disabled={!scroll.canSlower} aria-label="Más lento">
            <Minus />
          </Button>
          <span className="min-w-12 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite" aria-label={`Velocidad ${formatSpeed(scroll.speed)}`}>
            {formatSpeed(scroll.speed)}
          </span>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={scroll.faster} disabled={!scroll.canFaster} aria-label="Más rápido">
            <Plus />
          </Button>
        </div>
      )}

      <Button className="ml-1 h-10 min-w-32 rounded-full" onClick={() => onPlayingChange(!playing)} aria-pressed={playing}>
        {playing ? <Pause /> : <Play />}
        {playing ? "Pausar" : "Reproducir"}
      </Button>
    </div>
  );
}
