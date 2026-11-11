"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAPO_MAX, useSongView } from "./song-view";

const NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const;
const ACCIDENTALS = [
  { value: "", symbol: "♮", label: "Natural" },
  { value: "b", symbol: "♭", label: "Bemol" },
  { value: "#", symbol: "♯", label: "Sostenido" },
] as const;

/** Mi♯, Si♯, Do♭ y Fa♭ no se usan como tono: son otra nota natural. */
const isAllowed = (note: string, accidental: string) =>
  !((accidental === "#" && (note === "E" || note === "B")) || (accidental === "b" && (note === "C" || note === "F")));

const chip =
  "inline-flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";
const chipOn = "bg-primary text-primary-foreground";
const chipOff = "bg-secondary text-secondary-foreground hover:bg-accent";

/** Contenido del selector de tono: nota, alteración y cejilla. */
export function KeyPicker() {
  const { originalKey, currentKey, semitones, capo, sheetKey, setKeyRoot, shift, setCapo, reset } = useSongView();
  const note = currentKey?.[0] ?? "";
  const accidental = currentKey && /[#b]/.test(currentKey[1] ?? "") ? currentKey[1] : "";
  const changed = semitones !== 0 || (originalKey !== null && currentKey !== originalKey);

  return (
    <div className="space-y-4">
      {originalKey ? (
        <>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Nota">
            {NOTES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={n === note}
                aria-label={`Tono ${n}`}
                onClick={() => setKeyRoot(n)}
                className={cn(chip, "font-mono font-semibold", n === note ? chipOn : chipOff)}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Alteración">
            {ACCIDENTALS.map((a) => (
              <button
                key={a.label}
                type="button"
                aria-pressed={a.value === accidental}
                disabled={!isAllowed(note, a.value)}
                onClick={() => setKeyRoot(note + a.value)}
                className={cn(chip, "gap-1.5 text-xs", a.value === accidental ? chipOn : chipOff)}
              >
                <span className="text-base leading-none" aria-hidden>
                  {a.symbol}
                </span>
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Original: <span className="font-mono font-semibold text-foreground">{originalKey}</span>
            </span>
            {changed && (
              <Button variant="ghost" size="sm" className="-mr-2 h-7" onClick={reset}>
                <RotateCcw /> Volver al original
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Semitonos</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => shift(-1)} aria-label="Bajar medio tono">
                <Minus />
              </Button>
              <span className="min-w-10 text-center font-mono text-sm font-semibold tabular-nums">
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <Button variant="outline" size="icon-sm" onClick={() => shift(1)} aria-label="Subir medio tono">
                <Plus />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta canción no tiene tono cargado. Agregalo al editarla para poder elegir la nota.
          </p>
        </div>
      )}

      <div className="space-y-1 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Cejilla</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => setCapo(capo - 1)} disabled={capo === 0} aria-label="Bajar la cejilla un traste">
              <Minus />
            </Button>
            <span className="min-w-10 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite">
              {capo}
            </span>
            <Button variant="outline" size="icon-sm" onClick={() => setCapo(capo + 1)} disabled={capo === CAPO_MAX} aria-label="Subir la cejilla un traste">
              <Plus />
            </Button>
          </div>
        </div>
        <p className="min-h-4 text-xs text-muted-foreground">
          {capo > 0 &&
            (sheetKey ? (
              <>
                Traste {capo}: se muestran los acordes de <span className="font-mono font-semibold text-foreground">{sheetKey}</span>.
              </>
            ) : (
              <>Traste {capo}: se muestran las posiciones con la cejilla puesta.</>
            ))}
        </p>
      </div>
    </div>
  );
}
