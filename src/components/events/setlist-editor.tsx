"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, GripVertical, Music2, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KeyBadge } from "@/components/events/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_KEYS } from "@/lib/music/transpose";
import { estimateDuration, formatDuration, moveId } from "@/lib/setlist";
import { MOMENT_PRESETS } from "@/lib/templates";
import { cn } from "@/lib/utils";
import {
  addMomentToSetlist,
  addSongToSetlist,
  moveSetlistItem,
  removeSetlistItem,
  reorderSetlist,
  updateSetlistItem,
} from "@/server/actions/events";

export type SetlistItemDTO = {
  id: string;
  type: string;
  title: string | null;
  key: string | null;
  durationMin: number | null;
  notes: string | null;
  song: { id: string; title: string; artist: string | null; key: string | null; bpm: number | null } | null;
};
export type SongOption = { id: string; title: string; artist: string | null; key: string | null };

type Result = { ok: true } | { ok: false; error: string };

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

function KeySelect({ id, value, onChange, original }: { id: string; value: string; onChange: (v: string) => void; original: string | null }) {
  return (
    <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{original ? `Original (${original})` : "Sin tono"}</option>
      {ALL_KEYS.map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  );
}

export function SetlistEditor({
  eventId,
  items: serverItems,
  songs,
  canEdit,
}: {
  eventId: string;
  items: SetlistItemDTO[];
  songs: SongOption[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(serverItems);
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SetlistItemDTO | null>(null);
  const [adding, setAdding] = useState<"song" | "moment" | null>(null);
  useEffect(() => setItems(serverItems), [serverItems]);

  const songCount = items.filter((i) => i.type === "song").length;
  const total = estimateDuration(items);

  const run = (fn: () => Promise<Result>, success?: string, rollback?: SetlistItemDTO[]) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        if (rollback) setItems(rollback);
        toast.error(res.error);
      } else if (success) toast.success(success);
    });

  const move = (id: string, dir: -1 | 1) => {
    const prev = items;
    const order = moveId(items.map((i) => i.id), id, dir);
    setItems(order.map((oid) => items.find((i) => i.id === oid)!));
    run(() => moveSetlistItem(id, dir), undefined, prev);
  };

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const prev = items;
    const ids = items.map((i) => i.id).filter((id) => id !== dragId);
    ids.splice(ids.indexOf(targetId) + (items.findIndex((i) => i.id === dragId) < items.findIndex((i) => i.id === targetId) ? 1 : 0), 0, dragId);
    setItems(ids.map((id) => items.find((i) => i.id === id)!));
    run(() => reorderSetlist(eventId, ids), undefined, prev);
  };

  const remove = (item: SetlistItemDTO) => {
    const prev = items;
    setItems(items.filter((i) => i.id !== item.id));
    run(() => removeSetlistItem(item.id), "Quitado del setlist", prev);
  };

  let songNumber = 0;

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <div>
          <h2 className="font-semibold">Setlist</h2>
          <p className="text-xs text-muted-foreground">
            {songCount} {songCount === 1 ? "canción" : "canciones"} · {items.length - songCount}{" "}
            {items.length - songCount === 1 ? "momento" : "momentos"} · ~{formatDuration(total)}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAdding("song")}>
              <Plus /> Canción
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAdding("moment")}>
              <Sparkles /> Momento
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Music2 className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">El setlist está vacío</p>
          <p className="text-sm text-muted-foreground">
            {canEdit ? "Agregá canciones y momentos (oración, ofrenda, prédica…)." : "Todavía no se armó el setlist."}
          </p>
        </div>
      ) : (
        <ol className="divide-y">
          {items.map((item, index) => {
            const isSong = item.type === "song";
            if (isSong) songNumber++;
            const changedKey = isSong && item.key && item.song?.key && item.key !== item.song.key;
            return (
              <li
                key={item.id}
                draggable={canEdit && !pending}
                onDragStart={() => setDragId(item.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverId(item.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(item.id);
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 transition-colors md:px-4",
                  !isSong && "bg-muted/30",
                  dragId === item.id && "opacity-40",
                  overId === item.id && dragId !== item.id && "bg-primary/10",
                )}
              >
                {canEdit && (
                  <GripVertical className="hidden h-4 w-4 shrink-0 cursor-grab text-muted-foreground md:block" aria-hidden />
                )}
                <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {isSong ? songNumber : <Sparkles className="ml-auto h-3.5 w-3.5" />}
                </span>

                <div className="min-w-0 flex-1">
                  {isSong ? (
                    <p className="truncate text-sm">
                      {item.song ? (
                        <Link
                          href={`/canciones/${item.song.id}${item.key ? `?tono=${encodeURIComponent(item.key)}` : ""}`}
                          className="font-medium hover:text-primary hover:underline"
                          draggable={false}
                        >
                          {item.song.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-muted-foreground">Canción eliminada</span>
                      )}
                      {item.song?.artist && <span className="text-muted-foreground"> · {item.song.artist}</span>}
                    </p>
                  ) : (
                    <p className="truncate text-sm font-medium text-muted-foreground">{item.title}</p>
                  )}
                  {(item.notes || changedKey || item.durationMin || item.song?.bpm) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        changedKey && `Original en ${item.song!.key}`,
                        item.song?.bpm && `${item.song.bpm} BPM`,
                        item.durationMin && `${item.durationMin} min`,
                        item.notes,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                {isSong && <KeyBadge musicalKey={item.key ?? item.song?.key} />}

                {canEdit && (
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending || index === 0}
                      onClick={() => move(item.id, -1)}
                      aria-label="Subir"
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending || index === items.length - 1}
                      onClick={() => move(item.id, 1)}
                      aria-label="Bajar"
                    >
                      <ChevronDown />
                    </Button>
                    <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => setEditing(item)} aria-label="Editar">
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => remove(item)}
                      aria-label="Quitar"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {canEdit && (
        <>
          <AddSongDialog open={adding === "song"} onOpenChange={(o) => setAdding(o ? "song" : null)} eventId={eventId} songs={songs} />
          <AddMomentDialog open={adding === "moment"} onOpenChange={(o) => setAdding(o ? "moment" : null)} eventId={eventId} />
          <EditItemDialog item={editing} onClose={() => setEditing(null)} />
        </>
      )}
    </section>
  );
}

function AddSongDialog({
  open,
  onOpenChange,
  eventId,
  songs,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  eventId: string;
  songs: SongOption[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SongOption | null>(null);
  const [key, setKey] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? songs.filter((s) => `${s.title} ${s.artist ?? ""}`.toLowerCase().includes(q)) : songs;
  }, [query, songs]);

  const reset = () => {
    setQuery("");
    setSelected(null);
    setKey("");
    setNotes("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar canción</DialogTitle>
          <DialogDescription>Elegí una canción de la biblioteca del equipo.</DialogDescription>
        </DialogHeader>
        {songs.length === 0 ? (
          <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            Todavía no hay canciones en la biblioteca. Cargalas desde la sección Canciones.
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selected) return void toast.error("Elegí una canción");
              start(async () => {
                const res = await addSongToSetlist({ eventId, songId: selected.id, key, notes });
                if (!res.ok) return void toast.error(res.error);
                toast.success(`Agregaste "${selected.title}"`);
                reset();
                onOpenChange(false);
              });
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus className="pl-9" placeholder="Buscar por título o artista" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border p-1">
              {filtered.length === 0 && <li className="p-3 text-center text-sm text-muted-foreground">Sin resultados</li>}
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(s);
                      setKey("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent",
                      selected?.id === s.id && "bg-primary/15",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{s.title}</span>
                      {s.artist && <span className="text-muted-foreground"> · {s.artist}</span>}
                    </span>
                    <KeyBadge musicalKey={s.key} />
                  </button>
                </li>
              ))}
            </ul>
            {selected && (
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="add-key">Tono</Label>
                  <KeySelect id="add-key" value={key} onChange={setKey} original={selected.key} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-notes">Nota (opcional)</Label>
                  <Input id="add-notes" maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: canta Sofía, sin intro" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending || !selected}>
                Agregar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddMomentDialog({ open, onOpenChange, eventId }: { open: boolean; onOpenChange: (o: boolean) => void; eventId: string }) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setTitle("");
          setDuration("");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar momento</DialogTitle>
          <DialogDescription>Partes del evento que no son canciones.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await addMomentToSetlist({ eventId, title, durationMin: duration || null });
              if (!res.ok) return void toast.error(res.error);
              toast.success(`Agregaste "${title.trim()}"`);
              setTitle("");
              setDuration("");
              onOpenChange(false);
            });
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {MOMENT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTitle(p)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/50",
                  title === p && "border-primary bg-primary/15 text-primary",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className="space-y-1.5">
              <Label htmlFor="moment-title">Título</Label>
              <Input id="moment-title" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Oración pastoral" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="moment-duration">Minutos</Label>
              <Input id="moment-duration" type="number" min={0} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="5" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !title.trim()}>
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditItemDialog({ item, onClose }: { item: SetlistItemDTO | null; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setKey(item.key && item.key !== item.song?.key ? item.key : "");
    setDuration(item.durationMin ? String(item.durationMin) : "");
    setNotes(item.notes ?? "");
  }, [item]);

  const isSong = item?.type === "song";

  return (
    <Dialog open={item !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isSong ? (item?.song?.title ?? "Canción") : "Editar momento"}</DialogTitle>
          <DialogDescription>{isSong ? "Tono y notas para este evento." : "Título, duración y notas."}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!item) return;
            start(async () => {
              // Se mandan todos los campos: los vacíos se guardan como "sin valor"
              const res = await updateSetlistItem({
                itemId: item.id,
                title: isSong ? undefined : title,
                key: isSong ? key || item.song?.key || "" : undefined,
                durationMin: duration || null,
                notes,
              });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Guardado");
              onClose();
            });
          }}
        >
          {isSong ? (
            <div className="space-y-1.5">
              <Label htmlFor="edit-key">Tono para este evento</Label>
              <KeySelect id="edit-key" value={key} onChange={setKey} original={item?.song?.key ?? null} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration">Minutos</Label>
              <Input id="edit-duration" type="number" min={0} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Nota</Label>
              <Input id="edit-notes" maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: canta Sofía" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || (!isSong && !title.trim())}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
