"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Repeat } from "lucide-react";
import { parseBarLine, type BarLine, type Segment, type SheetLine } from "@/lib/music/chordpro";
import { buildSongSections, type SongSection } from "@/lib/music/sections";
import { toLatinChord } from "@/lib/music/transpose";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "cancionero:colapsar-repetidas";
/** Una tarjeta cuenta como "la visible" cuando su borde de arriba pasa esta distancia (px). */
const ACTIVE_OFFSET = 110;

type Variant = "default" | "stage";

/** Cada tarjeta define --sec con el color de su tipo; las clases `*-section` lo usan. */
const sectionColor = (section: SongSection) => ({ "--sec": `var(--sec-${section.group})` }) as React.CSSProperties;

/** Parte cada segmento en palabras para que las líneas largas puedan cortarse en el celular. */
function toPieces(segments: Segment[]) {
  const pieces: Segment[] = [];
  for (const seg of segments) {
    const words = seg.text.match(/\S+\s*|\s+/g) ?? [""];
    words.forEach((w, i) => pieces.push({ chord: i === 0 ? seg.chord : null, text: w }));
  }
  return pieces;
}

/** Fila de compases: "| G / / / | C / / / |" o una línea de solo acordes. */
function BarRow({ bar, chordName }: { bar: BarLine; chordName: (c: string) => string }) {
  return (
    <div className="flex flex-wrap gap-x-[0.4em] gap-y-[0.35em]">
      {bar.measures.map((measure, mi) => (
        <span
          key={mi}
          className={cn(
            "inline-flex items-baseline gap-x-[0.8em]",
            bar.bars ? "rounded-md border border-section/30 bg-section/10 px-[0.65em] py-[0.15em]" : "pr-[0.6em]",
          )}
        >
          {measure.map((token, ti) =>
            token.kind === "chord" ? (
              <span key={ti} className="font-bold text-section">
                {chordName(token.value)}
              </span>
            ) : (
              <span key={ti} className="font-medium text-muted-foreground">
                {token.value}
              </span>
            ),
          )}
        </span>
      ))}
    </div>
  );
}

function Lines({
  lines,
  chordsOn,
  lyricsOn,
  compact,
  chordName,
}: {
  lines: SheetLine[];
  chordsOn: boolean;
  lyricsOn: boolean;
  compact: boolean;
  chordName: (c: string) => string;
}) {
  return (
    <>
      {lines.map((line, li) => {
        if (line.type === "empty") return compact ? null : <div key={li} className="h-[0.75em]" />;
        if (line.type === "comment")
          return (
            <p key={li} className="text-[0.85em] italic text-muted-foreground">
              {line.text}
            </p>
          );

        // Línea sin letra (compases, "N.C.", solo acordes): fila de compases
        const bar = parseBarLine(line.segments);
        if (bar) return chordsOn ? <BarRow key={li} bar={bar} chordName={chordName} /> : null;

        // Vista "solo acordes": una fila con los acordes de la línea
        if (!lyricsOn) {
          const chords = line.segments.filter((s) => s.chord).map((s) => chordName(s.chord!));
          if (chords.length === 0) return null;
          return (
            <p key={li} className="flex flex-wrap gap-x-[1.25em] font-bold text-section">
              {chords.map((c, ci) => (
                <span key={ci}>{c}</span>
              ))}
            </p>
          );
        }

        // Acordes arriba de la sílaba exacta: cada palabra lleva su acorde encima
        const hasChords = chordsOn && line.segments.some((s) => s.chord);
        return (
          <div key={li} className="flex flex-wrap items-end">
            {toPieces(line.segments).map((p, pi) => (
              <span key={pi} className="inline-flex flex-col whitespace-pre">
                {hasChords && (
                  <span className={cn("min-h-[1.25em] font-bold text-section", p.chord && "pr-[0.35em]")}>
                    {p.chord ? chordName(p.chord) : ""}
                  </span>
                )}
                <span>{p.text || (p.chord && hasChords ? " " : "")}</span>
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
}

/**
 * Letra y acordes de una canción, con cada sección en su tarjeta (estilo OnStage).
 * Es el único lugar donde se dibuja una canción: lo usan el detalle, el Modo Atril
 * y la vista previa del editor.
 */
export function SongSections({
  source,
  semitones = 0,
  targetKey,
  showChords = true,
  mode = "both",
  notation = "american",
  compact = false,
  columns = false,
  fontSize = 16,
  variant = "default",
  nav = true,
  stickyNav = false,
  navClassName,
  scrollRoot,
  instantJump = false,
  className,
}: {
  source: string;
  semitones?: number;
  targetKey?: string;
  showChords?: boolean;
  /** Qué mostrar: acordes y letra, solo acordes o solo letra. */
  mode?: "both" | "chords" | "lyrics";
  notation?: "american" | "latin";
  /** Vista condensada: tarjetas más apretadas y sin líneas en blanco. */
  compact?: boolean;
  /** Dos columnas cuando la pantalla es ancha. */
  columns?: boolean;
  fontSize?: number;
  /** "stage" = Modo Atril: chips y etiquetas más grandes. */
  variant?: Variant;
  /** Chips de navegación arriba (uno por sección). */
  nav?: boolean;
  /** Deja los chips fijos arriba mientras se desplaza. */
  stickyNav?: boolean;
  navClassName?: string;
  /** Contenedor con scroll propio (el atril). Sin esto se usa el scroll de la página. */
  scrollRoot?: React.RefObject<HTMLElement>;
  /** Saltar sin animación (cuando el desplazamiento automático está andando). */
  instantJump?: boolean;
  className?: string;
}) {
  const sections = useMemo(() => buildSongSections(source, semitones, targetKey), [source, semitones, targetKey]);
  const chordsOn = showChords && mode !== "lyrics";
  const lyricsOn = mode !== "chords";
  const chordName = (c: string) => (notation === "latin" ? toLatinChord(c) : c);
  const stage = variant === "stage";

  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  // Secciones repetidas: se pueden colapsar todas juntas (se recuerda) o de a una
  const [collapseRepeats, setCollapseRepeats] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      setCollapseRepeats(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);
  const isCollapsed = (s: SongSection) => s.repeatOf !== null && (overrides[s.id] ?? collapseRepeats);
  const toggleOne = (s: SongSection) => setOverrides((o) => ({ ...o, [s.id]: !isCollapsed(s) }));
  const toggleAll = () => {
    const next = !collapseRepeats;
    setCollapseRepeats(next);
    setOverrides({});
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {}
  };

  const labelled = sections.filter((s) => s.label);
  const showNav = nav && labelled.length > 1;
  const hasRepeats = sections.some((s) => s.repeatOf !== null);

  // Marca en los chips la sección que se está viendo
  useEffect(() => {
    if (!showNav) return;
    const root = scrollRoot?.current ?? null;
    const target: HTMLElement | Window = root ?? window;
    let frame = 0;
    const update = () => {
      frame = 0;
      const cards = rootRef.current?.querySelectorAll<HTMLElement>("[data-section]");
      if (!cards?.length) return;
      // En dos columnas el orden en pantalla no es de arriba hacia abajo: no se marca ninguna
      if (columns && window.matchMedia("(min-width: 1024px)").matches) return setActive(null);
      const limit = (root ? root.getBoundingClientRect().top : 0) + ACTIVE_OFFSET;
      let current = cards[0].id;
      cards.forEach((card) => {
        if (card.getBoundingClientRect().top <= limit) current = card.id;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [showNav, scrollRoot, sections, columns, fontSize, collapseRepeats, overrides]);

  // Mantiene a la vista el chip de la sección activa
  useEffect(() => {
    const strip = stripRef.current;
    const chip = active ? strip?.querySelector<HTMLElement>(`[data-chip="${active}"]`) : null;
    if (!strip || !chip) return;
    strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  const jump = (id: string) => {
    rootRef.current
      ?.querySelector<HTMLElement>(`#${id}`)
      ?.scrollIntoView({ behavior: instantJump ? "instant" : "smooth", block: "start" });
  };

  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta canción todavía no tiene letra ni acordes.</p>;
  }

  return (
    <div ref={rootRef} className={className}>
      {showNav && (
        <nav
          aria-label="Secciones de la canción"
          className={cn("flex items-center gap-1", stickyNav && "sticky top-0 z-10 bg-background/95 backdrop-blur", navClassName)}
          // En el atril, tocar la hoja pausa el desplazamiento: los chips no
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={stripRef} className="scrollbar-none relative flex min-w-0 flex-1 gap-2 overflow-x-auto px-0.5 py-2">
            {labelled.map((s) => (
              <button
                key={s.id}
                type="button"
                data-chip={s.id}
                style={sectionColor(s)}
                onClick={() => jump(s.id)}
                aria-label={`Ir a ${s.label}`}
                aria-current={active === s.id ? "true" : undefined}
                title={s.label ?? undefined}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-full border-2 px-1.5 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  stage ? "h-11 min-w-11 text-sm" : "h-10 min-w-10 text-xs",
                  s.repeatOf !== null && "border-dashed",
                  active === s.id ? "border-section bg-section text-background" : "border-section/60 text-section hover:bg-section/10",
                )}
              >
                {s.abbr}
              </button>
            ))}
          </div>
          {hasRepeats && (
            <button
              type="button"
              onClick={toggleAll}
              aria-pressed={collapseRepeats}
              aria-label={collapseRepeats ? "Mostrar las secciones repetidas" : "Colapsar las secciones repetidas"}
              title={collapseRepeats ? "Mostrar las secciones repetidas" : "Colapsar las secciones repetidas"}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                stage ? "h-11 w-11" : "h-10 w-10",
                collapseRepeats ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Repeat className="h-4 w-4" />
            </button>
          )}
        </nav>
      )}

      <div className={cn("leading-snug", columns && "lg:columns-2 lg:gap-8")} style={{ fontSize }}>
        {sections.map((s) => {
          const collapsed = isCollapsed(s);
          const bodyId = `${s.id}-contenido`;
          const pill = s.label && (
            <>
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-section px-1.5 font-bold text-background",
                  stage ? "h-7 min-w-7 text-xs" : "h-6 min-w-6 text-[11px]",
                )}
                aria-hidden
              >
                {s.abbr}
              </span>
              <span className="font-semibold">{s.label}</span>
              {s.repeat && (
                <span className="rounded-full bg-section/15 px-1.5 text-[0.85em] font-bold text-section" aria-label={`se toca ${s.repeat} veces`}>
                  ×{s.repeat}
                </span>
              )}
            </>
          );
          const pillClass = cn(
            "absolute left-3 top-0 inline-flex max-w-[calc(100%-1.5rem)] -translate-y-1/2 items-center gap-1.5 rounded-full border border-section/50 bg-background py-0.5 pl-0.5 pr-3 text-foreground",
            stage ? "text-base" : "text-sm",
          );

          return (
            // El margen de arriba deja lugar a la etiqueta montada sobre el borde
            <div key={s.id} className={cn("break-inside-avoid", compact ? "pb-1 pt-4" : stage ? "pb-3 pt-5" : "pb-2 pt-4")}>
              <section
                id={s.id}
                data-section
                role="region"
                aria-label={s.label ? `${s.label}${s.repeat ? `, ${s.repeat} veces` : ""}${s.repeatOf !== null ? ", repetición" : ""}` : "Letra"}
                style={sectionColor(s)}
                className={cn(
                  "relative scroll-mt-[84px] rounded-xl border border-section/40 bg-section/[0.05]",
                  compact ? "px-3 pb-2" : stage ? "px-4 pb-4 md:px-5" : "px-4 pb-3.5",
                  s.label ? (compact ? "pt-5" : stage ? "pt-7" : "pt-6") : compact ? "pt-2" : "pt-3.5",
                )}
              >
                {s.label &&
                  (s.repeatOf !== null ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(s);
                      }}
                      aria-expanded={!collapsed}
                      aria-controls={bodyId}
                      aria-label={`${s.label}, repetición. ${collapsed ? "Mostrar" : "Ocultar"}`}
                      className={cn(
                        pillClass,
                        "border-dashed pr-2 before:absolute before:-inset-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {pill}
                      <Repeat className="h-3.5 w-3.5 text-section" aria-hidden />
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !collapsed && "rotate-180")} aria-hidden />
                    </button>
                  ) : (
                    <p className={pillClass}>{pill}</p>
                  ))}

                <div id={bodyId} className={cn("space-y-1", s.type === "tab" && "font-mono")}>
                  {collapsed ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(s);
                      }}
                      className="flex min-h-9 w-full items-center text-left text-[max(0.7em,0.8125rem)] text-muted-foreground"
                    >
                      Se repite · tocá para ver la letra
                    </button>
                  ) : (
                    <Lines lines={s.lines} chordsOn={chordsOn} lyricsOn={lyricsOn} compact={compact} chordName={chordName} />
                  )}
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
}
