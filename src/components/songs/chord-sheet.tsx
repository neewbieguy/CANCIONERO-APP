"use client";

import { useMemo } from "react";
import { SECTION_LABELS, parseChordPro, transposeChordPro, type Segment } from "@/lib/music/chordpro";
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
  fontSize = 16,
  className,
}: {
  source: string;
  semitones?: number;
  targetKey?: string;
  showChords?: boolean;
  fontSize?: number;
  className?: string;
}) {
  const sheet = useMemo(() => parseChordPro(transposeChordPro(source, semitones, targetKey)), [source, semitones, targetKey]);

  if (sheet.sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta canción todavía no tiene letra ni acordes.</p>;
  }

  return (
    <div className={cn("space-y-6 leading-snug", className)} style={{ fontSize }}>
      {sheet.sections.map((section, si) => {
        const label = section.label ?? (section.type !== "none" ? SECTION_LABELS[section.type] : null);
        const isChorus = section.type === "chorus";
        return (
          <section key={si} className={cn(isChorus && "border-l-2 border-primary/60 pl-3")}>
            {label && (
              <p className="mb-1.5 text-[0.7em] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            )}
            <div className={cn("space-y-1", section.type === "tab" && "font-mono")}>
              {section.lines.map((line, li) => {
                if (line.type === "empty") return <div key={li} className="h-[0.75em]" />;
                if (line.type === "comment")
                  return (
                    <p key={li} className="text-[0.85em] italic text-muted-foreground">
                      {line.text}
                    </p>
                  );
                const hasChords = showChords && line.segments.some((s) => s.chord);
                const pieces = toPieces(line.segments);
                return (
                  <div key={li} className="flex flex-wrap items-end">
                    {pieces.map((p, pi) => (
                      <span key={pi} className="inline-flex flex-col whitespace-pre">
                        {hasChords && (
                          <span className={cn("min-h-[1.25em] font-semibold text-primary", p.chord && "pr-[0.35em]")}>
                            {p.chord ?? ""}
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
