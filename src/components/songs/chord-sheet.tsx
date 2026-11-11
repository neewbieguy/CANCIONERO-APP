"use client";

import { useMemo } from "react";
import { SECTION_LABELS, parseChordPro, transposeChordPro, type Segment } from "@/lib/music/chordpro";
import { toLatinChord } from "@/lib/music/transpose";
import { cn } from "@/lib/utils";

/** Parte cada segmento en palabras para que las líneas largas puedan cortarse en el celular. */
function toPieces(segments: Segment[]) {
  const pieces: Segment[] = [];
  for (const seg of segments) {
    const words = seg.text.match(/\S+\s*|\s+/g) ?? [""];
    words.forEach((w, i) => pieces.push({ chord: i === 0 ? seg.chord : null, text: w }));
  }
  return pieces;
}

export function ChordSheet({
  source,
  semitones = 0,
  targetKey,
  showChords = true,
  mode = "both",
  notation = "american",
  compact = false,
  columns = false,
  fontSize = 16,
  className,
}: {
  source: string;
  semitones?: number;
  targetKey?: string;
  showChords?: boolean;
  /** Qué mostrar: acordes y letra, solo acordes o solo letra. */
  mode?: "both" | "chords" | "lyrics";
  notation?: "american" | "latin";
  /** Vista condensada: sin títulos de sección ni espacios entre bloques. */
  compact?: boolean;
  /** Dos columnas cuando la pantalla es ancha. */
  columns?: boolean;
  fontSize?: number;
  className?: string;
}) {
  const sheet = useMemo(() => parseChordPro(transposeChordPro(source, semitones, targetKey)), [source, semitones, targetKey]);
  const chordsOn = showChords && mode !== "lyrics";
  const lyricsOn = mode !== "chords";
  const chordName = (c: string) => (notation === "latin" ? toLatinChord(c) : c);

  if (sheet.sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta canción todavía no tiene letra ni acordes.</p>;
  }

  return (
    <div
      className={cn(
        "leading-snug",
        compact ? "space-y-1" : "space-y-6",
        columns && "lg:columns-2 lg:gap-12 [&>section]:break-inside-avoid",
        className,
      )}
      style={{ fontSize }}
    >
      {sheet.sections.map((section, si) => {
        const label = section.label ?? (section.type !== "none" ? SECTION_LABELS[section.type] : null);
        const isChorus = section.type === "chorus";
        return (
          <section key={si} className={cn(!compact && isChorus && "border-l-2 border-primary/60 pl-3")}>
            {label && !compact && (
              <p className="mb-1.5 text-[0.7em] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            )}
            <div className={cn("space-y-1", section.type === "tab" && "font-mono")}>
              {section.lines.map((line, li) => {
                if (line.type === "empty") return compact ? null : <div key={li} className="h-[0.75em]" />;
                if (line.type === "comment")
                  return (
                    <p key={li} className="text-[0.85em] italic text-muted-foreground">
                      {line.text}
                    </p>
                  );

                // Solo acordes: una fila con los acordes de la línea
                if (!lyricsOn) {
                  const chords = line.segments.filter((s) => s.chord).map((s) => chordName(s.chord!));
                  if (chords.length === 0) return null;
                  return (
                    <p key={li} className="flex flex-wrap gap-x-[1.25em] font-semibold text-primary">
                      {chords.map((c, ci) => (
                        <span key={ci}>{c}</span>
                      ))}
                    </p>
                  );
                }

                const hasChords = chordsOn && line.segments.some((s) => s.chord);
                const pieces = toPieces(line.segments);
                return (
                  <div key={li} className="flex flex-wrap items-end">
                    {pieces.map((p, pi) => (
                      <span key={pi} className="inline-flex flex-col whitespace-pre">
                        {hasChords && (
                          <span className={cn("min-h-[1.25em] font-semibold text-primary", p.chord && "pr-[0.35em]")}>
                            {p.chord ? chordName(p.chord) : ""}
                          </span>
                        )}
                        <span>{p.text || (p.chord && hasChords ? " " : "")}</span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
