"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { transposeKey } from "@/lib/music/transpose";
import { ChordSheet } from "./chord-sheet";

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

export function SongViewer({
  source,
  originalKey,
  initialSemitones = 0,
}: {
  source: string;
  originalKey: string | null;
  initialSemitones?: number;
}) {
  const [semitones, setSemitones] = useState(initialSemitones);
  const { fontSize, setFontSize, showChords, setShowChords } = useSheetPrefs(17);
  const shift = (n: number) => setSemitones((s) => (((s + n + 6) % 12) + 12) % 12 - 6 || 0);
  const currentKey = originalKey ? transposeKey(originalKey, semitones) : null;

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b p-3">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">Tono</span>
          <Button variant="outline" size="icon-sm" onClick={() => shift(-1)} aria-label="Bajar medio tono">
            <Minus />
          </Button>
          <span className="min-w-12 text-center font-mono text-sm font-semibold text-primary">
            {currentKey ?? (semitones > 0 ? `+${semitones}` : semitones)}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => shift(1)} aria-label="Subir medio tono">
            <Plus />
          </Button>
          {semitones !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSemitones(0)}>
              <RotateCcw /> Original{originalKey ? ` (${originalKey})` : ""}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Type className="mr-1 h-4 w-4 text-muted-foreground" aria-hidden />
          <Button variant="outline" size="icon-sm" onClick={() => setFontSize((f) => Math.max(FONT_MIN, f - 2))} aria-label="Letra más chica">
            <Minus />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setFontSize((f) => Math.min(FONT_MAX, f + 2))} aria-label="Letra más grande">
            <Plus />
          </Button>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={showChords} onCheckedChange={setShowChords} /> Acordes
        </label>
      </div>

      <div className="overflow-x-auto p-4 md:p-6">
        <ChordSheet
          source={source}
          semitones={semitones}
          targetKey={currentKey ?? undefined}
          showChords={showChords}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
}
