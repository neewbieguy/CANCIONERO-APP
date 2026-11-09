"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toChordPro } from "@/lib/music/chordpro";
import { ALL_KEYS } from "@/lib/music/transpose";
import { parseTags } from "@/lib/songs";
import { cn } from "@/lib/utils";
import { createSong, updateSong } from "@/server/actions/songs";
import { ChordSheet } from "./chord-sheet";

export type SongFormValues = {
  title: string;
  artist: string | null;
  key: string | null;
  bpm: number | null;
  tags: string | null;
  chordSheet: string | null;
};

const EXAMPLE = `Verso 1
G              D
Tu amor me alcanzó
Em             C
cuando no lo esperaba

Coro
C        G
Cantaré, cantaré`;

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

export function SongForm({ mode, songId, initial }: { mode: "create" | "edit"; songId?: string; initial?: SongFormValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [bpm, setBpm] = useState(initial?.bpm ? String(initial.bpm) : "");
  const [tags, setTags] = useState(parseTags(initial?.tags).join(", "));
  const [sheet, setSheet] = useState(initial?.chordSheet ?? "");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const preview = useMemo(() => (sheet.trim() ? toChordPro(sheet) : ""), [sheet]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { title, artist, key, bpm: bpm || null, tags: parseTags(tags), chordSheet: sheet };
    start(async () => {
      if (mode === "create") {
        const res = await createSong(input);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Canción guardada");
        router.push(`/canciones/${res.id}`);
      } else {
        const res = await updateSong(songId!, input);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Cambios guardados");
        router.push(`/canciones/${songId}`);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Gracia sublime" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="artist">Artista</Label>
          <Input id="artist" maxLength={100} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ej: Marcos Witt" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[140px_140px_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="key">Tono original</Label>
          <select id="key" className={selectClass} value={key} onChange={(e) => setKey(e.target.value)}>
            <option value="">Sin tono</option>
            {(key && !ALL_KEYS.includes(key) ? [key, ...ALL_KEYS] : ALL_KEYS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bpm">BPM</Label>
          <Input id="bpm" type="number" min={0} max={300} value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="72" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Etiquetas</Label>
          <Input id="tags" maxLength={200} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Adoración, Rápida, Santa Cena" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="sheet">Letra y acordes</Label>
          <div className="inline-flex rounded-lg bg-muted p-0.5 lg:hidden">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs",
                  tab === t ? "bg-background shadow" : "text-muted-foreground",
                )}
              >
                {t === "edit" ? <PencilLine className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {t === "edit" ? "Escribir" : "Vista previa"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Pegá la letra con los acordes en la línea de arriba (como en la mayoría de las páginas de acordes) o en formato
          ChordPro (<code className="rounded bg-muted px-1">[G]Tu amor</code>). Las líneas &quot;Verso&quot;, &quot;Coro&quot; o
          &quot;Puente&quot; marcan las secciones.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            id="sheet"
            value={sheet}
            onChange={(e) => setSheet(e.target.value)}
            placeholder={EXAMPLE}
            spellCheck={false}
            className={cn("min-h-[420px] font-mono text-sm leading-relaxed", tab === "preview" && "hidden lg:block")}
          />
          <div className={cn("min-h-[200px] overflow-auto rounded-xl border bg-muted/20 p-4 lg:max-h-[600px]", tab === "edit" && "hidden lg:block")}>
            {preview ? (
              <ChordSheet source={preview} fontSize={15} />
            ) : (
              <p className="text-sm text-muted-foreground">Acá vas a ver cómo queda.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !title.trim()}>
          {pending && <Loader2 className="animate-spin" />}
          {mode === "create" ? "Guardar canción" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
