"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  ListMusic,
  Maximize,
  Minimize,
  Minus,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { semitonesBetween, transposeKey } from "@/lib/music/transpose";
import { cn } from "@/lib/utils";
import { basePxPerSec, useAutoScroll, useScrollSpeed } from "./auto-scroll";
import { SheetBar } from "./sheet-bar";
import { SongSections } from "./song-sections";
import { STAGE_BASE_FONT, useSheetPrefs } from "./song-viewer";

export type StageItem = {
  id: string;
  type: string;
  title: string | null;
  key: string | null;
  notes: string | null;
  durationMin: number | null;
  song: { id: string; title: string; artist: string | null; key: string | null; bpm: number | null; chordSheet: string | null } | null;
};

/** Mantiene la pantalla encendida mientras el atril está abierto (si el navegador lo permite). */
function useWakeLock() {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    if (!nav.wakeLock) return;
    let lock: Sentinel | null = null;
    const acquire = () => nav.wakeLock!.request("screen").then((l) => (lock = l)).catch(() => {});
    const onVisible = () => document.visibilityState === "visible" && acquire();
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);
}

function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-sm tabular-nums text-muted-foreground">{now}</span>;
}

/** Punto que titila al ritmo del BPM. */
function BpmPulse({ bpm }: { bpm: number }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5" title={`${bpm} BPM`}>
      <span
        className="absolute inline-flex h-full w-full rounded-full bg-primary"
        style={{ animation: `stage-pulse ${60 / bpm}s ease-out infinite` }}
      />
      <style>{`@keyframes stage-pulse{0%{opacity:1;transform:scale(1)}60%,100%{opacity:.15;transform:scale(.6)}}`}</style>
    </span>
  );
}

export function StageMode({ eventId, eventTitle, items }: { eventId: string; eventTitle: string; items: StageItem[] }) {
  const songs = items.filter((i) => i.type === "song" && i.song);
  const [index, setIndex] = useState(0);
  // Transposición elegida para cada canción (arranca en el tono del evento)
  const [offsets, setOffsets] = useState<Record<string, number>>(() =>
    Object.fromEntries(songs.map((s) => [s.id, s.key && s.song?.key ? semitonesBetween(s.song.key, s.key) : 0])),
  );
  const { zoom, setZoom, showChords, setShowChords, twoColumns, setTwoColumns } = useSheetPrefs();
  const [scrolling, setScrolling] = useState(false);
  const scroll = useScrollSpeed();
  const [listOpen, setListOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useWakeLock();

  const current = songs[index];
  const song = current?.song;
  const semitones = current ? (offsets[current.id] ?? 0) : 0;
  const currentKey = song?.key ? transposeKey(song.key, semitones) : null;

  // Lo que viene después de esta canción (momentos y la próxima canción)
  const pos = current ? items.findIndex((i) => i.id === current.id) : -1;
  const upNext = pos >= 0 ? items.slice(pos + 1, pos + 3) : [];

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= songs.length) return;
      setIndex(i);
      setScrolling(false);
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [songs.length],
  );

  const transpose = (n: number) =>
    current && setOffsets((o) => ({ ...o, [current.id]: ((((o[current.id] ?? 0) + n + 6) % 12) + 12) % 12 - 6 || 0 }));

  // Desplazamiento automático (el mismo que en la pantalla de la canción)
  useAutoScroll({
    target: scrollRef,
    playing: scrolling,
    pxPerSec: basePxPerSec(song?.bpm) * scroll.speed,
    onStop: () => setScrolling(false),
  });

  // Teclado y pedaleras Bluetooth (suelen mandar flechas o AvPág/RePág)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const el = scrollRef.current;
      const atBottom = el ? el.scrollTop + el.clientHeight >= el.scrollHeight - 4 : true;
      const atTop = el ? el.scrollTop <= 4 : true;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "PageDown" || e.key === "ArrowDown") {
        e.preventDefault();
        if (atBottom) go(index + 1);
        else el?.scrollBy({ top: el.clientHeight * 0.8, behavior: "smooth" });
      } else if (e.key === "PageUp" || e.key === "ArrowUp") {
        e.preventDefault();
        if (atTop) go(index - 1);
        else el?.scrollBy({ top: -el.clientHeight * 0.8, behavior: "smooth" });
      } else if (e.key === " ") {
        e.preventDefault();
        setScrolling((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (songs.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <ListMusic className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium">Este setlist no tiene canciones</p>
        <Button asChild>
          <Link href={`/eventos/${eventId}`}>Volver al evento</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Barra superior */}
      <header className="pt-safe shrink-0 border-b bg-card/80 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-2 md:px-4">
          <Button asChild variant="ghost" size="icon" aria-label="Salir del Modo Atril">
            <Link href={`/eventos/${eventId}`}>
              <X />
            </Link>
          </Button>
          <button className="min-w-0 flex-1 text-left" onClick={() => setListOpen(true)}>
            <p className="truncate text-xs text-muted-foreground">
              {eventTitle} · {index + 1}/{songs.length}
            </p>
            <p className="flex items-center gap-2 truncate font-semibold">
              {song?.title}
              {song?.bpm ? <BpmPulse bpm={song.bpm} /> : null}
            </p>
          </button>
          <div className="hidden sm:block">
            <Clock />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setListOpen(true)} aria-label="Ver setlist">
            <ListMusic />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label="Pantalla completa" className="hidden md:inline-flex">
            {fullscreen ? <Minimize /> : <Maximize />}
          </Button>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3 overflow-x-auto border-t px-2 py-1.5 md:px-4">
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => transpose(-1)} aria-label="Bajar medio tono">
              <Minus />
            </Button>
            <span className="min-w-10 text-center font-mono text-sm font-semibold text-primary">{currentKey ?? semitones}</span>
            <Button variant="outline" size="icon-sm" onClick={() => transpose(1)} aria-label="Subir medio tono">
              <Plus />
            </Button>
          </div>
          <Button
            variant={showChords ? "secondary" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => setShowChords(!showChords)}
            aria-pressed={showChords}
          >
            Acordes
          </Button>
          {/* Dos columnas: solo sirve en pantallas anchas (tablet o atril horizontal) */}
          <Button
            variant={twoColumns ? "secondary" : "outline"}
            size="sm"
            className="hidden shrink-0 lg:inline-flex"
            onClick={() => setTwoColumns(!twoColumns)}
            aria-pressed={twoColumns}
          >
            <Columns2 /> 2 columnas
          </Button>
        </div>
      </header>

      {/* Hoja */}
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="h-full overflow-y-auto px-3 pb-6 md:px-8" onClick={() => scrolling && setScrolling(false)}>
          <div className={cn("mx-auto", twoColumns ? "max-w-7xl" : "max-w-5xl")}>
            {(song?.artist || current?.notes) && (
              <p className="pt-3 text-sm text-muted-foreground">
                {[song?.artist, current?.notes && `📝 ${current.notes}`].filter(Boolean).join(" · ")}
              </p>
            )}
            {song?.chordSheet?.trim() ? (
              <SongSections
                key={song.id}
                variant="stage"
                source={song.chordSheet}
                semitones={semitones}
                targetKey={currentKey ?? undefined}
                showChords={showChords}
                columns={twoColumns}
                fontSize={Math.round(STAGE_BASE_FONT * zoom)}
                stickyNav
                navClassName="-mx-3 px-3 md:-mx-8 md:px-8"
                scrollRoot={scrollRef}
                instantJump={scrolling}
              />
            ) : (
              <p className="pt-6 text-muted-foreground">Esta canción no tiene letra ni acordes cargados.</p>
            )}

            {upNext.length > 0 && (
              <div className="mt-10 space-y-1 border-t pt-4 text-sm text-muted-foreground">
                <p className="text-xs uppercase tracking-wide">Después</p>
                {upNext.map((i) => (
                  <p key={i.id} className="flex items-center gap-2">
                    {i.type === "song" ? (
                      <>
                        <ChevronRight className="h-4 w-4" /> {i.song?.title ?? "Canción eliminada"}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> {i.title}
                        {i.durationMin ? ` (${i.durationMin} min)` : ""}
                      </>
                    )}
                  </p>
                ))}
              </div>
            )}
            <div className="h-[40vh]" aria-hidden />
          </div>
        </div>

        {/* Barra flotante: zoom de la letra y desplazamiento automático */}
        <SheetBar
          zoom={zoom}
          onZoom={setZoom}
          playing={scrolling}
          onPlayingChange={setScrolling}
          scroll={scroll}
          className="absolute bottom-3 left-1/2 -translate-x-1/2"
        />
      </div>

      {/* Anterior / siguiente */}
      <footer className="pb-safe grid shrink-0 grid-cols-2 gap-2 border-t bg-card/80 p-2 backdrop-blur">
        <Button variant="secondary" size="lg" disabled={index === 0} onClick={() => go(index - 1)} className="justify-start">
          <ChevronLeft />
          <span className="truncate">{index > 0 ? songs[index - 1].song?.title : "Anterior"}</span>
        </Button>
        <Button size="lg" disabled={index === songs.length - 1} onClick={() => go(index + 1)} className="justify-end">
          <span className="truncate">{index < songs.length - 1 ? songs[index + 1].song?.title : "Última canción"}</span>
          <ChevronRight />
        </Button>
      </footer>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Setlist</SheetTitle>
          </SheetHeader>
          <ol className="mt-4 space-y-1">
            {items.map((i) => {
              const si = songs.findIndex((s) => s.id === i.id);
              if (si === -1)
                return (
                  <li key={i.id} className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" /> {i.type === "song" ? "Canción eliminada" : i.title}
                  </li>
                );
              return (
                <li key={i.id}>
                  <button
                    onClick={() => {
                      go(si);
                      setListOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent",
                      si === index && "bg-primary/15 font-medium text-primary",
                    )}
                  >
                    <span className="w-5 text-right font-mono text-xs">{si + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{i.song?.title}</span>
                    <span className="font-mono text-xs">{i.key ?? i.song?.key}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-xs text-muted-foreground">
            Atajos: ← → cambian de canción · AvPág/RePág bajan y suben (y pasan de canción al llegar al final) · Espacio
            activa el desplazamiento automático.
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
